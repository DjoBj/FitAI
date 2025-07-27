import { Request, Response, NextFunction } from 'express';
import { getUpcomingSchedule } from '@/api/v1/services/planActivation.service';

/**
 * @route   GET /api/ai/schedule
 * @desc    Get user's upcoming workouts and meals
 * @access  Private
 */
export const getSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const days = parseInt(req.query.days as string) || 7; // Default to 7 days

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID not found' });
    }

    // Get upcoming schedule
    const schedule = await getUpcomingSchedule(userId.toString(), days);

    // Group workouts and meals by date for easier frontend consumption
    const scheduleByDate: { [date: string]: { workouts: any[], meals: any[] } } = {};

    // Process workouts
    schedule.workouts.forEach(workout => {
      const dateKey = workout.workout_date.toISOString().split('T')[0];
      if (!scheduleByDate[dateKey]) {
        scheduleByDate[dateKey] = { workouts: [], meals: [] };
      }
      scheduleByDate[dateKey].workouts.push({
        id: workout._id,
        day_number: workout.day_number,
        week_number: workout.week_number,
        status: workout.status,
        exercises: workout.exercises,
        total_duration_minutes: workout.total_duration_minutes,
        notes: workout.notes,
        workout_date: workout.workout_date
      });
    });

    // Process meals
    schedule.meals.forEach(meal => {
      const dateKey = meal.meal_date.toISOString().split('T')[0];
      if (!scheduleByDate[dateKey]) {
        scheduleByDate[dateKey] = { workouts: [], meals: [] };
      }
      scheduleByDate[dateKey].meals.push({
        id: meal._id,
        day_number: meal.day_number,
        week_number: meal.week_number,
        meal_type: meal.meal_type,
        status: meal.status,
        meal_data: meal.meal_data,
        meal_date: meal.meal_date
      });
    });

    return res.status(200).json({
      success: true,
      message: 'Schedule retrieved successfully',
      data: {
        scheduleByDate,
        summary: {
          totalWorkouts: schedule.workouts.length,
          totalMeals: schedule.meals.length,
          daysRequested: days
        }
      }
    });
  } catch (error) {
    console.error('Error getting schedule:', error);
    return res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to get schedule' 
    });
  }
}; 