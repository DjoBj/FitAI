import { Request, Response, NextFunction } from 'express';
import { User } from '@/models/user.model';
import { generateAndSavePlan } from '../../services/ai.service';

/**
 * @route   POST /api/ai/generate-plan
 * @desc    Generate a personalized fitness plan using AI
 * @access  Private
 */
export const generatePlan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID not found' });
    }

    // Validate that user has completed the wizard/profile setup
    if (!user.fitnessGoal || !user.trainingLevel) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please complete your profile setup first. Missing fitness goal or training level.' 
      });
    }

    // Build the AI plan request from user profile data (populated during wizard)
    const planRequest = {
      goal_type: user.fitnessGoal,
      duration_weeks: user.planDuration || 8,
      difficulty_level: user.trainingLevel,
      focus_areas: user.focusAreas || [],
      equipment_available: user.equipmentAvailable || []
    };

    // Use the comprehensive service function that handles the complete flow
    const newPlan = await generateAndSavePlan(userId.toString(), planRequest);

    return res.status(201).json({
      success: true,
      message: 'Plan generated successfully',
      data: newPlan
    });
  } catch (error) {
    console.error('Error in generatePlan controller:', error);
    next(error);
    return;
  }
};