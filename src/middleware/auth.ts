import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/user.model';
import { config } from '../config/env';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

interface JwtPayload {
  userId: string;
  email?: string;
  iat: number;
  exp: number;
}

export class AuthMiddleware {
  public static generateAccessToken(user: IUser): string {
    return (jwt as any).sign({ userId: user._id, email: user.email }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRE,
      issuer: 'fitai-backend',
      audience: 'fitai-users'
    });
  }

  public static generateRefreshToken(user: IUser): string {
    return (jwt as any).sign({ userId: user._id }, config.JWT_REFRESH_SECRET, {
      expiresIn: config.JWT_REFRESH_EXPIRE,
      issuer: 'fitai-backend',
      audience: 'fitai-refresh'
    });
  }

  public static verifyRefreshToken(token: string): JwtPayload {
    return (jwt as any).verify(token, config.JWT_REFRESH_SECRET, {
      issuer: 'fitai-backend',
      audience: 'fitai-refresh'
    }) as JwtPayload;
  }

  public static async authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.header('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const token = authHeader.slice(7);
      const decoded = (jwt as any).verify(token, config.JWT_SECRET) as JwtPayload;

      const user = await User.findById(decoded.userId);
      if (!user) {
        res.status(401).json({ success: false, message: 'User not found' });
        return;
      }

      req.user = user;
      next();
    } catch (err) {
      res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
  }
}