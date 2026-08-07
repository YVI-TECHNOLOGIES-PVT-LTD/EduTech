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
}
