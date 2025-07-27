import { Request, Response, NextFunction } from 'express';
import { Progress } from '@/models/progress.model';
import { User } from '@/models/user.model';
import { Plan } from '@/models/plan.model';

export const getCurrentProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID not found.' });
    }

    // Get user to check currentPlanId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (!user.currentPlanId) {
      return res.status(400).json({ success: false, message: 'No active plan found. Please confirm a plan first.' });
    }

    // Verify the plan exists and is active
    const plan = await Plan.findOne({ _id: user.currentPlanId, user: userId, status: 'active' });
    if (!plan) {
      return res.status(400).json({ success: false, message: 'Active plan not found. Please confirm a plan first.' });
    }

    const current = await Progress.findOne({ 
      user_id: userId.toString(), 
      plan_id: user.currentPlanId, 
      status: 'in_progress' 
    }).sort({ day_number: 1 });

    // If no progress exists, create initial progress for day 1
    if (!current) {
      const initialProgress = new Progress({
        user_id: userId.toString(),
        plan_id: user.currentPlanId,
        day_number: 1,
        status: 'in_progress'
      });
      await initialProgress.save();
      
      return res.json({ success: true, data: initialProgress });
    }

    return res.json({ success: true, data: current });
  } catch (error) {
    next(error);
    return;
  }
};

export const completeToday = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID not found.' });
    }

    // Get user to check currentPlanId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (!user.currentPlanId) {
      return res.status(400).json({ success: false, message: 'No active plan found. Please confirm a plan first.' });
    }

    const today = await Progress.findOneAndUpdate(
      { user_id: userId.toString(), plan_id: user.currentPlanId, status: 'in_progress' },
      { status: 'completed', completedAt: new Date() },
      { new: true }
    );

    if (!today) {
      return res.status(404).json({ success: false, message: 'No in-progress day to complete.' });
    }

    const nextDay = new Progress({
      user_id: userId.toString(),
      plan_id: user.currentPlanId,
      day_number: today.day_number + 1,
      status: 'in_progress'
    });

    await nextDay.save();

    return res.json({ success: true, message: 'Day completed and next day started.', data: nextDay });
  } catch (error) {
    next(error);
    return;
  }
};

export const getHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID not found.' });
    }

    // Get user to check currentPlanId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (!user.currentPlanId) {
      return res.status(400).json({ success: false, message: 'No active plan found. Please confirm a plan first.' });
    }

    const history = await Progress.find({ 
      user_id: userId.toString(), 
      plan_id: user.currentPlanId 
    }).sort({ day_number: 1 });

    return res.json({ success: true, data: history });
  } catch (error) {
    next(error);
    return;
  }
};

export const shiftDay = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { direction } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID not found.' });
    }

    // Get user to check currentPlanId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (!user.currentPlanId) {
      return res.status(400).json({ success: false, message: 'No active plan found. Please confirm a plan first.' });
    }

    const current = await Progress.findOne({ 
      user_id: userId.toString(), 
      plan_id: user.currentPlanId, 
      status: 'in_progress' 
    });

    if (!current) {
      return res.status(404).json({ success: false, message: 'No current day found.' });
    }

    const newDayNumber = direction === 'forward' ? current.day_number + 1 : current.day_number - 1;
    if (newDayNumber < 1) {
      return res.status(400).json({ success: false, message: 'Cannot move to day 0 or less.' });
    }

    current.status = 'completed';
    current.completedAt = new Date();
    await current.save();

    const newDay = new Progress({ 
      user_id: userId.toString(), 
      plan_id: user.currentPlanId, 
      day_number: newDayNumber,
      status: 'in_progress'
    });
    await newDay.save();

    return res.json({ success: true, message: 'Day shifted.', data: newDay });
  } catch (error) {
    next(error);
    return;
  }
};
