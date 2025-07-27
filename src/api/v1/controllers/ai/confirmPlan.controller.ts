import { Request, Response, NextFunction } from 'express';
import { Plan } from '@/models/plan.model';
import { User } from '@/models/user.model';

/**
 * @route   POST /api/ai/confirm-plan/:id
 * @desc    Confirm and activate a previously generated plan
 * @access  Private
 */
export const confirmPlan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const planId = req.params.id;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID not found' });
    }

    // Find the plan and verify it belongs to the user
    const plan = await Plan.findOne({ _id: planId, user: userId });
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    // Update plan status to active
    plan.status = 'active';
    await plan.save();

    // Update user's currentPlanId to reference this active plan
    await User.findByIdAndUpdate(userId, { currentPlanId: planId });

    return res.status(200).json({
      success: true,
      message: 'Plan confirmed and activated',
      data: plan
    });
  } catch (error) {
    next(error);
    return;
  }
};
