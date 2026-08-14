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
      console.error('[AuthController] Login Exception:', err.message || err);
      return res.status(401).json({ error: err.message || 'Invalid login credentials' });
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
      const { full_name, fullName, email, phone, mobile, password, school_id, org_id } = req.body;
      const targetName = full_name || fullName;
      const targetPhone = phone || mobile;
      const targetEmail = email;

      if (!targetName || !targetEmail || !password || !targetPhone) {
        return res.status(400).json({ error: 'Full name, email, phone, and password are required.' });
      }

      const orgId = org_id || school_id || (req as any).tenantOrgId || (req as any).context?.user?.org_id || (req as any).context?.user?.school_id;


      const result = await AuthService.registerParent({
        full_name: targetName,
        email: targetEmail,
        phone: targetPhone,
        password,
        org_id: orgId,
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

