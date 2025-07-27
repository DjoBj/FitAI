import { Request, Response, NextFunction } from 'express';
import { Plan } from '@/models/plan.model';
import { User } from '@/models/user.model';

/**
 * @route   GET /api/v1/ai/my-plan
 * @desc    Get user's current plan (active or draft)
 * @access  Private
 */
export const getMyPlan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID not found' });
    }

    // Get user to check currentPlanId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let plan = null;

    // If user has a currentPlanId, try to get that plan
    if (user.currentPlanId) {
      plan = await Plan.findOne({ _id: user.currentPlanId, user: userId });
    }

    // If no current plan or current plan not found, get the most recent plan
    if (!plan) {
      plan = await Plan.findOne({ user: userId }).sort({ createdAt: -1 });
    }

    if (!plan) {
      return res.status(404).json({ 
        success: false, 
        message: 'No plan found. Please generate a new plan first.' 
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Plan retrieved successfully',
      data: plan
    });
  } catch (error) {
    next(error);
    return;
  }
};

/**
 * @route   GET /api/v1/ai/plans
 * @desc    Get all user's plans
 * @access  Private
 */
export const getAllPlans = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID not found' });
    }

    const plans = await Plan.find({ user: userId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Plans retrieved successfully',
      data: plans
    });
  } catch (error) {
    next(error);
    return;
  }
}; 