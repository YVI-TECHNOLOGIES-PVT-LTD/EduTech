import { Request, Response } from 'express';
import { AuthService } from './auth.service';

export class AuthController {
  static async login(req: Request, res: Response) {
    console.log('>>> LOGIN CONTROLLER HIT');
    try {
      const { email, password, passwordHash } = req.body;
      const userPassword = password || passwordHash;

      if (!email || !userPassword) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const result = await AuthService.login(email, userPassword);
      return res.json(result);
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      console.error('[AuthController] Login Exception:', errMsg);

      // Check for Database / Infrastructure / Prisma connection failures
      const isDbError =
        err?.name === 'PrismaClientInitializationError' ||
        err?.name === 'PrismaClientRustPanicError' ||
        err?.name === 'PrismaClientUnknownRequestError' ||
        errMsg.includes('FATAL') ||
        errMsg.includes('connection slots') ||
        errMsg.includes('max clients') ||
        errMsg.includes('ECONNREFUSED') ||
        errMsg.includes('ETIMEDOUT') ||
        errMsg.includes('Can\'t reach database server') ||
        errMsg.includes('database server was not found') ||
        errMsg.includes('Invalid `prisma.');

      if (isDbError) {
        return res.status(503).json({
          error: 'Sign-in is temporarily unavailable. Please try again in a moment.',
          code: 'SERVICE_UNAVAILABLE',
        });
      }

      if (errMsg.includes('Account is currently') || errMsg.includes('Access denied')) {
        return res.status(403).json({
          error: errMsg,
          code: 'ACCOUNT_STATUS_FORBIDDEN',
        });
      }

      if (errMsg.includes('User has no password set')) {
        return res.status(400).json({
          error: errMsg,
          code: 'NO_PASSWORD_SET',
        });
      }

      return res.status(401).json({
        error: 'Invalid login credentials',
        code: 'INVALID_CREDENTIALS',
      });
    }
  }

  static async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required' });
      }
      const result = await AuthService.refresh(refreshToken);
      return res.json(result);
    } catch (err: any) {
      return res.status(401).json({ error: err.message || 'Token refresh failed' });
    }
  }

  static async logout(req: Request, res: Response) {
    return res.json({ success: true, message: 'Logged out successfully' });
  }

  static async registerParent(req: Request, res: Response) {
    try {
      const { full_name, fullName, email, phone, mobile, password, school_id, org_id, source } =
        req.body;
      const targetName = full_name || fullName;
      const targetPhone = phone || mobile;
      const targetEmail = email;

      if (!targetName || !targetEmail || !password || !targetPhone) {
        return res
          .status(400)
          .json({ error: 'Full name, email, phone, and password are required.' });
      }

      const orgId =
        org_id ||
        school_id ||
        (req as any).tenantOrgId ||
        (req as any).context?.user?.org_id ||
        (req as any).context?.user?.school_id;

      const result = await AuthService.registerParent({
        full_name: targetName,
        email: targetEmail,
        phone: targetPhone,
        password,
        org_id: orgId,
        source,
      });

      return res.status(201).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Parent registration failed' });
    }
  }

  static async verifyOtp(req: Request, res: Response) {
    try {
      const { email, phone, otp } = req.body;
      const result = await AuthService.verifyOtp({ email, phone, otp });
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'OTP verification failed' });
    }
  }
}
