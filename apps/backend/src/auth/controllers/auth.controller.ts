import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { LoginRequestSchema, RefreshRequestSchema, LogoutRequestSchema } from '../dto/auth.dto';
import { ResponseHelper } from '../../common/helpers/response.helper';

export class AuthController {
  private authService = new AuthService();

  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedReq = LoginRequestSchema.parse(req.body);
      const result = await this.authService.login(validatedReq, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      res.json(ResponseHelper.success(result, 'Authentication successful'));
    } catch (err: any) {
      res
        .status(401)
        .json(
          ResponseHelper.error(
            [{ code: 'AUTH_LOGIN_FAILED', message: err.message || 'Login failed' }],
            'Authentication failed',
          ),
        );
    }
  };

  public refresh = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedReq = RefreshRequestSchema.parse(req.body);
      const result = await this.authService.refresh(validatedReq.refreshToken);
      res.json(ResponseHelper.success(result, 'Token refreshed successfully'));
    } catch (err: any) {
      res
        .status(401)
        .json(
          ResponseHelper.error(
            [{ code: 'AUTH_REFRESH_FAILED', message: err.message || 'Token refresh failed' }],
            'Token refresh failed',
          ),
        );
    }
  };

  public logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedReq = LogoutRequestSchema.parse(req.body);
      await this.authService.logout(validatedReq.refreshToken);
      res.json(ResponseHelper.success({ loggedOut: true }, 'Logout successful'));
    } catch (err: any) {
      res
        .status(400)
        .json(
          ResponseHelper.error(
            [{ code: 'AUTH_LOGOUT_FAILED', message: err.message || 'Logout failed' }],
            'Logout failed',
          ),
        );
    }
  };

  public me = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      if (!user?.id) {
        res
          .status(401)
          .json(
            ResponseHelper.error(
              [{ code: 'UNAUTHORIZED', message: 'User context not found' }],
              'Unauthorized',
            ),
          );
        return;
      }
      const result = await this.authService.getCurrentUser(user.id);
      res.json(ResponseHelper.success(result, 'User profile fetched successfully'));
    } catch (err: any) {
      res
        .status(404)
        .json(
          ResponseHelper.error(
            [{ code: 'NOT_FOUND', message: err.message }],
            'User profile not found',
          ),
        );
    }
  };
}
