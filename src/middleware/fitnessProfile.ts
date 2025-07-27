import { Request, Response, NextFunction } from 'express';
import { FitnessProfile } from '../models/fitnessProfile.model';

export class FitnessProfileMiddleware {
  /**
   * Ensures that the user has a completed fitness profile
   */
  public static async ensureProfileComplete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id;
      const profile = await FitnessProfile.findOne({ userId });

      if (!profile) {
        res.status(400).json({
          success: false,
          message: 'You must complete your fitness profile before using this feature.'
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to verify fitness profile',
        error: (error as Error).message
      });
    }
  }
}