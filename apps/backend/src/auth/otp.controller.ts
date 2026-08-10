import { Request, Response } from 'express';
import { otpService } from './otp.service';
import { requestOtpSchema, verifyOtpSchema } from './dto/otp.dto';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export class OtpController {
  static async requestOtp(req: Request, res: Response) {
    try {
      const validated = requestOtpSchema.parse(req.body);
      const result = await otpService.requestOtp(validated.orgId, validated.phone);
      return res.status(200).json(result);
    } catch (err: any) {
      if (err.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation Failed',
          details: err.errors.map((e: any) => e.message),
        });
      }

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          error: err.message,
          errorCode: err.errorCode,
        });
      }

      logger.error('[OtpController] Request OTP Error:', err);
      return res.status(500).json({
        error: 'Authentication infrastructure failure. Please try again later.',
      });
    }
  }

  static async verifyOtp(req: Request, res: Response) {
    try {
      const validated = verifyOtpSchema.parse(req.body);
      const result = await otpService.verifyOtp(validated.orgId, validated.phone, validated.otp);
      return res.status(200).json(result);
    } catch (err: any) {
      if (err.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation Failed',
          details: err.errors.map((e: any) => e.message),
        });
      }

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          error: err.message,
          errorCode: err.errorCode,
        });
      }

      logger.error('[OtpController] Verify OTP Error:', err);
      return res.status(500).json({
        error: 'Authentication infrastructure failure. Please try again later.',
      });
    }
  }
}
