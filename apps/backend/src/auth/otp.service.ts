import { cacheService } from '../cache/cache.service';
import { CacheKeyFactory } from '../cache/cache-key.factory';
import { NativeOtpCrypto } from './crypto.utils';
import { OTP_CONSTANTS } from './otp.constants';
import { normalizePhone } from '../utils/phone.utils';
import { ISmsAdapter, consoleSmsAdapter } from '../notifications/sms/sms.adapter';
import {
  ValidationError,
  RateLimitError,
  ForbiddenError,
  InternalServerError,
} from '../utils/errors';
import prisma from '../lib/prismaClient';
import { logger } from '../utils/logger';

export interface OtpStateRecord {
  orgId: string;
  phone: string;
  otpHash: string;
}

export interface RegistrationProofRecord {
  orgId: string;
  phone: string;
  purpose: 'parent_registration';
}

export class OtpService {
  constructor(private readonly smsAdapter: ISmsAdapter = consoleSmsAdapter) {}

  /**
   * Request a new 6-digit OTP for Parent registration.
   */
  async requestOtp(
    rawOrgId: string,
    rawPhone: string,
  ): Promise<{
    success: boolean;
    message: string;
    expiresInSeconds: number;
    cooldownSeconds: number;
    devOtp?: string;
  }> {
    const phone = normalizePhone(rawPhone);
    const orgId = rawOrgId?.trim();

    if (!orgId) {
      throw new ValidationError('Organization ID is required.');
    }

    // 1. Verify Organization exists in Database
    const org = await prisma.organizations.findUnique({
      where: { org_id: orgId },
      select: { org_id: true, status: true },
    });

    if (!org || org.status !== 'active') {
      throw new ValidationError('Organization not found or is currently inactive.');
    }

    // 2. Check Hourly Request Limit (Max 5 / hr per org:phone)
    const reqKey = CacheKeyFactory.otp.requests(orgId, phone);
    const currentReqCount = (await cacheService.get<number>(reqKey, { failClosed: true })) || 0;

    if (currentReqCount >= OTP_CONSTANTS.OTP_MAX_REQUESTS_PER_HOUR) {
      throw new RateLimitError(
        `Maximum OTP requests per hour exceeded (${OTP_CONSTANTS.OTP_MAX_REQUESTS_PER_HOUR}/hr). Please try again later.`,
      );
    }

    // 3. Check Resend Cooldown Lock (60s)
    const cooldownKey = CacheKeyFactory.otp.cooldown(orgId, phone);
    const cooldownTtl = await cacheService.ttl(cooldownKey, { failClosed: true });

    if (cooldownTtl > 0) {
      throw new RateLimitError(`Please wait ${cooldownTtl} seconds before requesting another OTP.`);
    }

    // 4. Generate CSPRNG 6-digit OTP & Compute SHA-256 Hash
    const plaintextOtp = NativeOtpCrypto.generateOtpCode();
    const otpHash = NativeOtpCrypto.hashOtp(plaintextOtp);

    // 5. Store ONLY OTP Hash in Cache (TTL = 300s)
    const stateKey = CacheKeyFactory.otp.state(orgId, phone);
    const otpState: OtpStateRecord = { orgId, phone, otpHash };
    await cacheService.set(stateKey, otpState, {
      ttlMs: OTP_CONSTANTS.OTP_EXPIRY_SECONDS * 1000,
      failClosed: true,
    });

    // 6. Initialize Attempt Counter (0 attempts, TTL = 300s)
    const attemptsKey = CacheKeyFactory.otp.attempts(orgId, phone);
    await cacheService.set(attemptsKey, 0, {
      ttlMs: OTP_CONSTANTS.OTP_EXPIRY_SECONDS * 1000,
      failClosed: true,
    });

    // 7. Create Resend Cooldown Lock atomically (TTL = 60s)
    await cacheService.setNX(cooldownKey, '1', OTP_CONSTANTS.OTP_RESEND_COOLDOWN_SECONDS, {
      failClosed: true,
    });

    // 8. Increment Hourly Request Counter atomically
    const newReqCount = await cacheService.incr(reqKey, { failClosed: true });
    if (newReqCount === 1) {
      // Set 1-hour TTL on initial creation
      await cacheService.expire(reqKey, 3600, { failClosed: true });
    }

    // 9. Dispatch OTP via SMS Adapter
    await this.smsAdapter.sendOtp(phone, plaintextOtp);

    return {
      success: true,
      message: 'OTP dispatched successfully.',
      expiresInSeconds: OTP_CONSTANTS.OTP_EXPIRY_SECONDS,
      cooldownSeconds: OTP_CONSTANTS.OTP_RESEND_COOLDOWN_SECONDS,
      devOtp: process.env.NODE_ENV !== 'production' ? plaintextOtp : undefined,
    };
  }

  /**
   * Verify submitted OTP code against Redis hash.
   */
  async verifyOtp(
    rawOrgId: string,
    rawPhone: string,
    otpInput: string,
  ): Promise<{ success: boolean; registrationToken: string; expiresInSeconds: number }> {
    const phone = normalizePhone(rawPhone);
    const orgId = rawOrgId?.trim();

    if (!orgId) {
      throw new ValidationError('Organization ID is required.');
    }

    const stateKey = CacheKeyFactory.otp.state(orgId, phone);
    const attemptsKey = CacheKeyFactory.otp.attempts(orgId, phone);

    // 1. Fetch OTP State from Cache
    const otpState = await cacheService.get<OtpStateRecord>(stateKey, { failClosed: true });

    if (!otpState) {
      throw new ValidationError('OTP has expired or is invalid. Please request a new OTP.');
    }

    if (otpState.orgId !== orgId || otpState.phone !== phone) {
      throw new ValidationError('OTP verification tenant or phone mismatch.');
    }

    // 2. Fetch Attempts Count
    const currentAttempts =
      (await cacheService.get<number>(attemptsKey, { failClosed: true })) || 0;

    if (currentAttempts >= OTP_CONSTANTS.OTP_MAX_ATTEMPTS) {
      await cacheService.delete(stateKey, { failClosed: true });
      await cacheService.delete(attemptsKey, { failClosed: true });
      throw new RateLimitError(
        'Maximum verification attempts exceeded (5). OTP invalidated. Please request a new OTP.',
      );
    }

    // 3. Compute SHA-256 Hash of Submitted OTP & Timing-Safe Compare
    const inputHash = NativeOtpCrypto.hashOtp(otpInput);
    const isMatch = NativeOtpCrypto.timingSafeCompare(inputHash, otpState.otpHash);

    if (!isMatch) {
      const newAttempts = await cacheService.incr(attemptsKey, { failClosed: true });

      if (newAttempts >= OTP_CONSTANTS.OTP_MAX_ATTEMPTS) {
        await cacheService.delete(stateKey, { failClosed: true });
        await cacheService.delete(attemptsKey, { failClosed: true });
        throw new RateLimitError(
          'Maximum verification attempts exceeded (5). OTP invalidated. Please request a new OTP.',
        );
      }

      const remaining = OTP_CONSTANTS.OTP_MAX_ATTEMPTS - newAttempts;
      throw new ValidationError(`Invalid OTP code. ${remaining} attempt(s) remaining.`);
    }

    // 4. Verification Succeeded — Atomically consume OTP State to prevent concurrent verification replay
    const consumedState = await cacheService.getAndDelete<OtpStateRecord>(stateKey, {
      failClosed: true,
    });
    if (!consumedState) {
      throw new ValidationError('OTP has already been verified or is invalid.');
    }
    await cacheService.delete(attemptsKey, { failClosed: true });

    // 5. Generate Registration Proof Token (TTL = 600s)
    const registrationToken = NativeOtpCrypto.generateRegistrationToken();
    const proofKey = CacheKeyFactory.otp.proof(registrationToken);
    const proofRecord: RegistrationProofRecord = {
      orgId,
      phone,
      purpose: 'parent_registration',
    };

    await cacheService.set(proofKey, proofRecord, {
      ttlMs: OTP_CONSTANTS.REGISTRATION_PROOF_TTL_SECONDS * 1000,
      failClosed: true,
    });

    return {
      success: true,
      registrationToken,
      expiresInSeconds: OTP_CONSTANTS.REGISTRATION_PROOF_TTL_SECONDS,
    };
  }

  /**
   * Validate & Consume Registration Proof Token (Single-Use).
   */
  async validateRegistrationProof(
    token: string,
    expectedOrgId: string,
    rawPhone: string,
  ): Promise<boolean> {
    if (!token) {
      throw new ForbiddenError('Registration proof token is missing.');
    }

    const phone = normalizePhone(rawPhone);
    const proofKey = CacheKeyFactory.otp.proof(token);

    // ATOMIC GET-AND-DELETE: Proof token is retrieved and deleted in 1 atomic operation
    const proofRecord = await cacheService.getAndDelete<RegistrationProofRecord>(proofKey, {
      failClosed: true,
    });

    if (!proofRecord) {
      throw new ForbiddenError('Invalid or expired registration proof token.');
    }

    if (
      proofRecord.orgId !== expectedOrgId ||
      proofRecord.phone !== phone ||
      proofRecord.purpose !== 'parent_registration'
    ) {
      throw new ForbiddenError('Registration proof token scope mismatch.');
    }

    return true;
  }
}

export const otpService = new OtpService();
