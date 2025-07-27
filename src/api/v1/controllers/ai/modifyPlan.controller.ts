import { Request, Response } from 'express';
import { modifyPlan, getPlanModificationHistory } from '@/api/v1/services/planModification.service';

/**
 * @route   PUT /api/ai/modify-plan/:id
 * @desc    Modify an active plan with new workouts and/or meals
 * @access  Private
 */
export const modifyPlanController = async (req: Request, res: Response) => {
  try {
    const planId = req.params.id;
    const userId = req.user?._id;
    const { modifications } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID not found' });
    }

    if (!modifications || (!modifications.workouts && !modifications.meals)) {
      return res.status(400).json({ 
        success: false, 
        message: 'No modifications provided. Please specify workouts and/or meals to modify.' 
      });
    }

    // Validate modifications structure
    if (modifications.workouts) {
      for (const workout of modifications.workouts) {
        if (!workout.weekNumber || !workout.dayNumber || !workout.exercises) {
          return res.status(400).json({ 
            success: false, 
            message: 'Invalid workout modification format. Required: weekNumber, dayNumber, exercises' 
          });
        }
      }
    }

    if (modifications.meals) {
      for (const meal of modifications.meals) {
        if (!meal.weekNumber || !meal.dayNumber || !meal.mealType || !meal.mealData) {
          return res.status(400).json({ 
            success: false, 
            message: 'Invalid meal modification format. Required: weekNumber, dayNumber, mealType, mealData' 
          });
        }
      }
    }

    // Modify the plan
    const result = await modifyPlan({
      planId,
      userId: userId.toString(),
      modifications
    });

    return res.status(200).json({
      success: true,
      message: result.message,
      data: {
        modifications: result.modifications,
        summary: {
          totalWorkoutsModified: result.modifications.workouts.updated + result.modifications.workouts.created,
          totalMealsModified: result.modifications.meals.updated + result.modifications.meals.created
        }
      }
    });

  } catch (error) {
    console.error('Error modifying plan:', error);
    return res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to modify plan' 
    });
  }
};

/**
 * @route   GET /api/ai/modify-plan/:id/history
 * @desc    Get modification history for a plan
 * @access  Private
 */
export const getPlanHistory = async (req: Request, res: Response) => {
  try {
    const planId = req.params.id;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID not found' });
    }

    // Get modification history
    const history = await getPlanModificationHistory(planId, userId.toString());

    // Group by week for easier consumption
    const historyByWeek: { [week: number]: { workouts: any[], meals: any[] } } = {};

    // Process workouts
    history.workouts.forEach(workout => {
      if (!historyByWeek[workout.week_number]) {
        historyByWeek[workout.week_number] = { workouts: [], meals: [] };
      }
      historyByWeek[workout.week_number].workouts.push({
        id: workout._id,
        day_number: workout.day_number,
        status: workout.status,
        exercises: workout.exercises,
        total_duration_minutes: workout.total_duration_minutes,
        notes: workout.notes,
        workout_date: workout.workout_date
      });
    });

    // Process meals
    history.meals.forEach(meal => {
      if (!historyByWeek[meal.week_number]) {
        historyByWeek[meal.week_number] = { workouts: [], meals: [] };
      }
      historyByWeek[meal.week_number].meals.push({
        id: meal._id,
        day_number: meal.day_number,
        meal_type: meal.meal_type,
        status: meal.status,
        meal_data: meal.meal_data,
        meal_date: meal.meal_date
      });
    });

    return res.status(200).json({
      success: true,
      message: 'Plan history retrieved successfully',
      data: {
        historyByWeek,
        summary: {
          totalWeeks: Object.keys(historyByWeek).length,
          totalWorkouts: history.workouts.length,
          totalMeals: history.meals.length
        }
      }
    });

  } catch (error) {
    console.error('Error getting plan history:', error);
    return res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to get plan history' 
    });
  }
}; 