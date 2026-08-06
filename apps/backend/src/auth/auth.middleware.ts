import { Request, Response, NextFunction } from 'express';
import { sessionService } from './session.service';
import { JwtValidator } from './jwt.validator';

declare global {
  namespace Express {
    interface Request {
      context?: {
        user: {
          id: string;
          email: string;
          orgId?: string;
          school_id?: string;
          role?: string;
          roles: string[];
          permissions: string[];
          login_status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED';
        };
        token: string;
      };
    }
  }
}

const jwtValidator = new JwtValidator();

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Missing or invalid Authorization header',
      });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedJwt = jwtValidator.validateAccessToken(token);
    const userProfile = await sessionService.validateSession(token);

    if (!userProfile && !decodedJwt) {
      return res
        .status(401)
        .json({ success: false, error: 'UNAUTHORIZED', message: 'Invalid or expired session' });
    }

    const authenticatedUser = {
      id: userProfile?.id || decodedJwt?.sub || '',
      email: userProfile?.email || decodedJwt?.email || '',
      orgId: userProfile?.school_id || decodedJwt?.orgId || '',
      school_id: userProfile?.school_id || decodedJwt?.orgId || '',
      role: userProfile?.roles?.[0] || decodedJwt?.role || 'user',
      roles: userProfile?.roles || [decodedJwt?.role || 'user'],
      permissions: userProfile?.permissions || [],
      login_status: userProfile?.login_status || 'APPROVED',
    };

    (req as any).user = authenticatedUser;
    req.context = {
      user: authenticatedUser,
      token,
    };

    next();
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, error: 'UNAUTHORIZED', message: 'Authentication failed' });
  }
};

export const authenticateOptional = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const userProfile = await sessionService.validateSession(token);
    if (userProfile) {
      (req as any).user = userProfile;
      req.context = {
        user: userProfile,
        token,
      };
    }
    next();
  } catch (error) {
    next();
  }
};

export const checkLoginApproval = (req: Request, res: Response, next: NextFunction) => {
  const user = req.context?.user;
  if (!user) return next();

  if (user.roles.some((r: string) => ['ADMIN', 'FACULTY', 'HEAD_OF_INSTITUTE'].includes(r)))
    return next();

  if (user.login_status !== 'APPROVED') {
    return res
      .status(403)
      .json({ success: false, error: 'FORBIDDEN', message: 'Account login is pending approval' });
  }

  next();
};
