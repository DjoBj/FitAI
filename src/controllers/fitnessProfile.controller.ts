import { Request, Response } from 'express';
import { FitnessProfile } from '../models/fitnessProfile.model';

export class FitnessProfileController {
  /**
   * Get current user's fitness profile
   */
  public static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!._id;
      const profile = await FitnessProfile.findOne({ userId });

      if (!profile) {
        res.status(404).json({
          success: false,
          message: 'Fitness profile not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        profile
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch fitness profile',
        error: (error as Error).message
      });
    }
  }

  /**
   * Create or update the user's fitness profile
   */
  public static async upsertProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!._id;
      const data = req.body;

      const profile = await FitnessProfile.findOneAndUpdate(
        { userId },
        { ...data, userId },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      res.status(200).json({
        success: true,
        message: 'Fitness profile saved successfully',
        profile
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to save fitness profile',
        error: (error as Error).message
      });
    }
  }
}
