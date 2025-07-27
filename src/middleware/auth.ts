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
    return jwt.sign({ userId: user._id, email: user.email }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRE,
      issuer: 'fitai-backend',
      audience: 'fitai-users'
    });
  }

  public static generateRefreshToken(user: IUser): string {
    return jwt.sign({ userId: user._id }, config.JWT_REFRESH_SECRET, {
      expiresIn: config.JWT_REFRESH_EXPIRE,
      issuer: 'fitai-backend',
      audience: 'fitai-refresh'
    });
  }

  public static verifyRefreshToken(token: string): JwtPayload {
    return jwt.verify(token, config.JWT_REFRESH_SECRET, {
      issuer: 'fitai-backend',
      audience: 'fitai-refresh'
    }) as JwtPayload;
  }

  public static async authenticate(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.header('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const token = authHeader.slice(7);
      const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;

      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }

      req.user = user;
      next();
    } catch (err) {
      res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
  }
}