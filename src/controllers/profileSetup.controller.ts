import { Request, Response } from 'express';
import { User } from '../models/user.model';

export class ProfileSetupController {
  /**
   * Update user's profile setup with fitness-related data
   */
  public static async setupFitnessProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!._id;
      const {
        fitnessGoal,
        trainingLevel,
        planDuration,
        focusAreas,
        equipmentAvailable,
        gender
      } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      // Update user with fitness-related fields using correct property names
      if (fitnessGoal) user.fitnessGoal = fitnessGoal;
      if (trainingLevel) user.trainingLevel = trainingLevel;
      if (planDuration) user.planDuration = planDuration;
      if (focusAreas) user.focusAreas = focusAreas;
      if (equipmentAvailable) user.equipmentAvailable = equipmentAvailable;
      if (gender) user.gender = gender;

      await user.save();

      res.status(200).json({
        success: true,
        message: 'Fitness profile setup completed',
        user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to complete profile setup',
        error: (error as Error).message
      });
    }
  }
}
