import { Request, Response } from 'express';
import { User } from '../models/user.model';
import { AuthMiddleware } from '../middleware/auth';

export class AuthController {
  public static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, firstName, lastName, phoneNumber, birthDate, password } = req.body;
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(400).json({ success: false, message: 'Email already in use' });
        return;
      }

      const newUser = await User.create({ email, firstName, lastName, phoneNumber, birthDate, password });
      const accessToken = AuthMiddleware.generateAccessToken(newUser);
      const refreshToken = AuthMiddleware.generateRefreshToken(newUser);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        accessToken,
        refreshToken,
        user: newUser
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Registration failed', error: (error as Error).message });
    }
  }

  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select('+password');
      if (!user || !(await user.comparePassword(password))) {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
        return;
      }

      const accessToken = AuthMiddleware.generateAccessToken(user);
      const refreshToken = AuthMiddleware.generateRefreshToken(user);
      user.lastLoginAt = new Date();
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Login successful',
        accessToken,
        refreshToken,
        user
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Login failed', error: (error as Error).message });
    }
  }

  public static async logout(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      user.lastLoginAt = new Date();
      await user.save();
      res.status(200).json({ success: true, message: 'User logged out successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Logout failed', error: (error as Error).message });
    }
  }

  public static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        res.status(400).json({ success: false, message: 'Refresh token required' });
        return;
      }

      const decoded = AuthMiddleware.verifyRefreshToken(refreshToken);
      const user = await User.findById(decoded.userId);
      if (!user) {
        res.status(401).json({ success: false, message: 'User not found' });
        return;
      }

      const newAccessToken = AuthMiddleware.generateAccessToken(user);
      const newRefreshToken = AuthMiddleware.generateRefreshToken(user);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user
      });
    } catch (error) {
      res.status(401).json({ success: false, message: (error as Error).message || 'Refresh failed' });
    }
  }
}