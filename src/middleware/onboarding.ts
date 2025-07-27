import { Request, Response, NextFunction } from 'express';
import { FitnessProfile } from '../models/fitnessProfile.model';

export class OnboardingMiddleware {
  /**
   * After login, ensure the user has submitted a fitness profile
   */
  public static async requireProfileSetup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id;
      const profileExists = await FitnessProfile.exists({ userId });

      if (!profileExists) {
        res.status(403).json({
          success: false,
          message: 'Fitness profile setup required after login',
          redirectTo: '/api/profile'
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error checking profile status',
        error: (error as Error).message
      });
    }
  }
}