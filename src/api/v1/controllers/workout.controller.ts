import { Request, Response, NextFunction } from 'express';
import { Workout } from '@/models/workout.model';
import { User } from '@/models/user.model';
import { Plan } from '@/models/plan.model';

/**
 * @route   GET /api/v1/workouts/daily/:dayNumber
 * @desc    Get workout for a specific day
 * @access  Private
 */
export const getDailyWorkout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const dayNumber = parseInt(req.params.dayNumber);

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID not found' });
    }

    if (!dayNumber || dayNumber < 1) {
      return res.status(400).json({ success: false, message: 'Invalid day number' });
    }

    // Get user to check currentPlanId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.currentPlanId) {
      return res.status(400).json({ success: false, message: 'No active plan found' });
    }

    // Get the workout for this day
    let workout = await Workout.findOne({
      user_id: userId.toString(),
      plan_id: user.currentPlanId,
      day_number: dayNumber
    });

    // If no workout exists, create one from the plan data
    if (!workout) {
      const plan = await Plan.findById(user.currentPlanId);
      if (!plan) {
        return res.status(404).json({ success: false, message: 'Active plan not found' });
      }

      // Calculate week number based on day number
      const weekNumber = Math.ceil(dayNumber / 7);
      
      // Get workout data from plan
      const planWorkout = plan.workoutPlan?.weeks?.find((week: any) => week.week === weekNumber);
      const dayWorkout = planWorkout?.days?.find((day: any) => day.day === dayNumber);

      if (!dayWorkout) {
        return res.status(404).json({ success: false, message: 'No workout planned for this day' });
      }

      // Create workout record
      workout = new Workout({
        user_id: userId.toString(),
        plan_id: user.currentPlanId,
        day_number: dayNumber,
        week_number: weekNumber,
        workout_date: new Date(),
        status: 'pending',
        exercises: dayWorkout.exercises.map((exercise: any) => ({
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          rest_seconds: exercise.rest_seconds,
          muscle_groups: exercise.muscle_groups,
          completed_sets: 0
        }))
      });

      await workout.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Workout retrieved successfully',
      data: workout
    });
  } catch (error) {
    next(error);
    return;
  }
};

/**
 * @route   GET /api/v1/workouts/weekly/:weekNumber
 * @desc    Get all workouts for a specific week
 * @access  Private
 */
export const getWeeklyWorkouts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const weekNumber = parseInt(req.params.weekNumber);

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID not found' });
    }

    if (!weekNumber || weekNumber < 1) {
      return res.status(400).json({ success: false, message: 'Invalid week number' });
    }

    // Get user to check currentPlanId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.currentPlanId) {
      return res.status(400).json({ success: false, message: 'No active plan found' });
    }

    const workouts = await Workout.find({
      user_id: userId.toString(),
      plan_id: user.currentPlanId,
      week_number: weekNumber
    }).sort({ day_number: 1 });

    return res.status(200).json({
      success: true,
      message: 'Weekly workouts retrieved successfully',
      data: workouts
    });
  } catch (error) {
    next(error);
    return;
  }
};

/**
 * @route   POST /api/v1/workouts/start/:workoutId
 * @desc    Start a workout
 * @access  Private
 */
export const startWorkout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const workoutId = req.params.workoutId;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID not found' });
    }

    const workout = await Workout.findOne({
      _id: workoutId,
      user_id: userId.toString()
    });

    if (!workout) {
      return res.status(404).json({ success: false, message: 'Workout not found' });
    }

    await workout.startWorkout();

    return res.status(200).json({
      success: true,
      message: 'Workout started successfully',
      data: workout
    });
  } catch (error) {
    next(error);
    return;
  }
};

/**
 * @route   POST /api/v1/workouts/complete/:workoutId
 * @desc    Complete a workout
 * @access  Private
 */
export const completeWorkout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const workoutId = req.params.workoutId;
    const { total_duration_minutes, calories_burned, difficulty_rating, notes } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID not found' });
    }

    const workout = await Workout.findOne({
      _id: workoutId,
      user_id: userId.toString()
    });

    if (!workout) {
      return res.status(404).json({ success: false, message: 'Workout not found' });
    }

    // Update workout with completion data
    if (total_duration_minutes) workout.total_duration_minutes = total_duration_minutes;
    if (calories_burned) workout.calories_burned = calories_burned;
    if (difficulty_rating) workout.difficulty_rating = difficulty_rating;
    if (notes) workout.notes = notes;

    await workout.completeWorkout();

    return res.status(200).json({
      success: true,
      message: 'Workout completed successfully',
      data: workout
    });
  } catch (error) {
    next(error);
    return;
  }
};

/**
 * @route   POST /api/v1/workouts/skip/:workoutId
 * @desc    Skip a workout
 * @access  Private
 */
export const skipWorkout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const workoutId = req.params.workoutId;
    const { notes } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID not found' });
    }

    const workout = await Workout.findOne({
      _id: workoutId,
      user_id: userId.toString()
    });

    if (!workout) {
      return res.status(404).json({ success: false, message: 'Workout not found' });
    }

    if (notes) workout.notes = notes;
    await workout.skipWorkout();

    return res.status(200).json({
      success: true,
      message: 'Workout skipped successfully',
      data: workout
    });
  } catch (error) {
    next(error);
    return;
  }
};

/**
 * @route   PATCH /api/v1/workouts/exercise/:workoutId/:exerciseIndex
 * @desc    Update exercise completion
 * @access  Private
 */
export const updateExerciseCompletion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const workoutId = req.params.workoutId;
    const exerciseIndex = parseInt(req.params.exerciseIndex);
    const { completed_sets, weight, notes } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID not found' });
    }

    if (exerciseIndex < 0) {
      return res.status(400).json({ success: false, message: 'Invalid exercise index' });
    }

    const workout = await Workout.findOne({
      _id: workoutId,
      user_id: userId.toString()
    });

    if (!workout) {
      return res.status(404).json({ success: false, message: 'Workout not found' });
    }

    if (exerciseIndex >= workout.exercises.length) {
      return res.status(400).json({ success: false, message: 'Exercise index out of range' });
    }

    const exercise = workout.exercises[exerciseIndex];
    
    if (completed_sets !== undefined) {
      exercise.completed_sets = Math.min(completed_sets, exercise.sets);
    }
    if (weight !== undefined) exercise.weight = weight;
    if (notes !== undefined) exercise.notes = notes;

    await workout.save();

    return res.status(200).json({
      success: true,
      message: 'Exercise updated successfully',
      data: workout
    });
  } catch (error) {
    next(error);
    return;
  }
};

/**
 * @route   GET /api/v1/workouts/history
 * @desc    Get workout history
 * @access  Private
 */
export const getWorkoutHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { startDate, endDate, limit = 30 } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID not found' });
    }

    let query: any = { user_id: userId.toString() };

    if (startDate && endDate) {
      query.workout_date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    const workouts = await Workout.find(query)
      .sort({ workout_date: -1 })
      .limit(parseInt(limit as string));

    return res.status(200).json({
      success: true,
      message: 'Workout history retrieved successfully',
      data: workouts
    });
  } catch (error) {
    next(error);
    return;
  }
};

/**
 * @route   GET /api/v1/workouts/stats
 * @desc    Get workout statistics
 * @access  Private
 */
export const getWorkoutStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { period = 'week' } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID not found' });
    }

    let startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    const stats = await Workout.aggregate([
      {
        $match: {
          user_id: userId.toString(),
          workout_date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          total_workouts: { $sum: 1 },
          completed_workouts: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          skipped_workouts: {
            $sum: { $cond: [{ $eq: ['$status', 'skipped'] }, 1, 0] }
          },
          total_duration: { $sum: '$total_duration_minutes' },
          total_calories: { $sum: '$calories_burned' },
          avg_difficulty: { $avg: '$difficulty_rating' }
        }
      }
    ]);

    const result = stats[0] || {
      total_workouts: 0,
      completed_workouts: 0,
      skipped_workouts: 0,
      total_duration: 0,
      total_calories: 0,
      avg_difficulty: 0
    };

    return res.status(200).json({
      success: true,
      message: 'Workout statistics retrieved successfully',
      data: {
        ...result,
        completion_rate: result.total_workouts > 0 
          ? Math.round((result.completed_workouts / result.total_workouts) * 100) 
          : 0
      }
    });
  } catch (error) {
    next(error);
    return;
  }
}; 