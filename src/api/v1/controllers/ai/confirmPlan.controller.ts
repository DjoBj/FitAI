import { Request, Response } from 'express';
import { Plan } from '@/models/plan.model';
import { activatePlan } from '@/api/v1/services/planActivation.service';

/**
 * @route   POST /api/ai/confirm-plan/:id
 * @desc    Confirm and activate a previously generated plan, automatically creating workouts and meals
 * @access  Private
 */
export const confirmPlan = async (req: Request, res: Response) => {
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

    // Check if plan is already active
    if (plan.status === 'active') {
      return res.status(400).json({ 
        success: false, 
        message: 'Plan is already active' 
      });
    }

    // Activate the plan - this will create all workouts and meals
    const activationResult = await activatePlan(planId, userId.toString());

    return res.status(200).json({
      success: true,
      message: activationResult.message,
      data: {
        plan: plan,
        activationDetails: {
          workoutsCreated: activationResult.workoutsCreated,
          mealsCreated: activationResult.mealsCreated,
          startDate: activationResult.startDate
        }
      }
    });
  } catch (error) {
    console.error('Error confirming plan:', error);
    return res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to confirm plan' 
    });
  }
};
