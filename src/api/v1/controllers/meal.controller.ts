import { Request, Response, NextFunction } from 'express';
import { Meal } from '@/models/meal.model';
import { User } from '@/models/user.model';
import { Plan } from '@/models/plan.model';

/**
 * @route   GET /api/v1/meals/daily/:dayNumber
 * @desc    Get all meals for a specific day
 * @access  Private
 */
export const getDailyMeals = async (req: Request, res: Response, next: NextFunction) => {
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

    // Get meals for this day
    let meals = await Meal.find({
      user_id: userId.toString(),
      plan_id: user.currentPlanId,
      day_number: dayNumber
    }).sort({ meal_type: 1 });

    // If no meals exist, create them from the plan data
    if (meals.length === 0) {
      const plan = await Plan.findById(user.currentPlanId);
      if (!plan) {
        return res.status(404).json({ success: false, message: 'Active plan not found' });
      }

      // Calculate week number based on day number
      const weekNumber = Math.ceil(dayNumber / 7);
      
      // Get meal data from plan
      const planMeals = plan.mealPlan?.daily_template?.meals;
      
      if (!planMeals) {
        return res.status(404).json({ success: false, message: 'No meal plan found' });
      }

      // Create meal records for each meal type
      const mealTypes = ['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'evening_snack'];
      const createdMeals = [];

      for (const mealType of mealTypes) {
        const mealData = planMeals[mealType as keyof typeof planMeals];
        if (mealData) {
          const meal = new Meal({
            user_id: userId.toString(),
            plan_id: user.currentPlanId,
            day_number: dayNumber,
            week_number: weekNumber,
            meal_date: new Date(),
            meal_type: mealType as any,
            status: 'pending',
            meal_data: {
              name: mealData.name,
              calories: mealData.calories,
              protein: mealData.protein,
              carbs: mealData.carbs,
              fats: mealData.fats,
              ingredients: mealData.ingredients,
              prep_time_minutes: mealData.prep_time_minutes,
              instructions: mealData.instructions
            }
          });

          await meal.save();
          createdMeals.push(meal);
        }
      }

      meals = createdMeals;
    }

    return res.status(200).json({
      success: true,
      message: 'Daily meals retrieved successfully',
      data: meals
    });
  } catch (error) {
    next(error);
    return;
  }
};

/**
 * @route   GET /api/v1/meals/weekly/:weekNumber
 * @desc    Get all meals for a specific week
 * @access  Private
 */
export const getWeeklyMeals = async (req: Request, res: Response, next: NextFunction) => {
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

    const meals = await Meal.find({
      user_id: userId.toString(),
      plan_id: user.currentPlanId,
      week_number: weekNumber
    }).sort({ day_number: 1, meal_type: 1 });

    return res.status(200).json({
      success: true,
      message: 'Weekly meals retrieved successfully',
      data: meals
    });
  } catch (error) {
    next(error);
    return;
  }
};

/**
 * @route   POST /api/v1/meals/prepare/:mealId
 * @desc    Mark meal as prepared
 * @access  Private
 */
export const prepareMeal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const mealId = req.params.mealId;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID not found' });
    }

    const meal = await Meal.findOne({
      _id: mealId,
      user_id: userId.toString()
    });

    if (!meal) {
      return res.status(404).json({ success: false, message: 'Meal not found' });
    }

    await meal.prepareMeal();

    return res.status(200).json({
      success: true,
      message: 'Meal marked as prepared',
      data: meal
    });
  } catch (error) {
    next(error);
    return;
  }
};

/**
 * @route   POST /api/v1/meals/consume/:mealId
 * @desc    Mark meal as consumed
 * @access  Private
 */
export const consumeMeal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const mealId = req.params.mealId;
    const { 
      calories_consumed, 
      protein_consumed, 
      carbs_consumed, 
      fats_consumed, 
      portion_eaten, 
      notes,
      rating 
    } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID not found' });
    }

    const meal = await Meal.findOne({
      _id: mealId,
      user_id: userId.toString()
    });

    if (!meal) {
      return res.status(404).json({ success: false, message: 'Meal not found' });
    }

    const consumptionData = {
      calories_consumed,
      protein_consumed,
      carbs_consumed,
      fats_consumed,
      portion_eaten,
      notes
    };

    await meal.consumeMeal(consumptionData);

    // Update rating if provided
    if (rating) {
      meal.rating = rating;
      await meal.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Meal marked as consumed',
      data: meal
    });
  } catch (error) {
    next(error);
    return;
  }
};

/**
 * @route   POST /api/v1/meals/skip/:mealId
 * @desc    Skip a meal
 * @access  Private
 */
export const skipMeal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const mealId = req.params.mealId;
    const { notes } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID not found' });
    }

    const meal = await Meal.findOne({
      _id: mealId,
      user_id: userId.toString()
    });

    if (!meal) {
      return res.status(404).json({ success: false, message: 'Meal not found' });
    }

    if (notes) meal.notes = notes;
    await meal.skipMeal();

    return res.status(200).json({
      success: true,
      message: 'Meal skipped successfully',
      data: meal
    });
  } catch (error) {
    next(error);
    return;
  }
};

/**
 * @route   GET /api/v1/meals/nutrition-summary/:weekNumber
 * @desc    Get nutrition summary for a week
 * @access  Private
 */
export const getWeeklyNutritionSummary = async (req: Request, res: Response, next: NextFunction) => {
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

    const summary = await Meal.getWeeklyNutritionSummary(userId.toString(), user.currentPlanId, weekNumber);
    const result = summary[0] || {
      total_calories: 0,
      total_protein: 0,
      total_carbs: 0,
      total_fats: 0,
      meals_consumed: 0
    };

    return res.status(200).json({
      success: true,
      message: 'Weekly nutrition summary retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
    return;
  }
};

/**
 * @route   GET /api/v1/meals/history
 * @desc    Get meal history
 * @access  Private
 */
export const getMealHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { startDate, endDate, limit = 30, mealType } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID not found' });
    }

    let query: any = { user_id: userId.toString() };

    if (startDate && endDate) {
      query.meal_date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    if (mealType) {
      query.meal_type = mealType;
    }

    const meals = await Meal.find(query)
      .sort({ meal_date: -1, meal_type: 1 })
      .limit(parseInt(limit as string));

    return res.status(200).json({
      success: true,
      message: 'Meal history retrieved successfully',
      data: meals
    });
  } catch (error) {
    next(error);
    return;
  }
};

/**
 * @route   GET /api/v1/meals/stats
 * @desc    Get meal statistics
 * @access  Private
 */
export const getMealStats = async (req: Request, res: Response, next: NextFunction) => {
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

    const stats = await Meal.aggregate([
      {
        $match: {
          user_id: userId.toString(),
          meal_date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          total_meals: { $sum: 1 },
          consumed_meals: {
            $sum: { $cond: [{ $eq: ['$status', 'consumed'] }, 1, 0] }
          },
          skipped_meals: {
            $sum: { $cond: [{ $eq: ['$status', 'skipped'] }, 1, 0] }
          },
          total_calories: { $sum: '$actual_consumption.calories_consumed' },
          total_protein: { $sum: '$actual_consumption.protein_consumed' },
          total_carbs: { $sum: '$actual_consumption.carbs_consumed' },
          total_fats: { $sum: '$actual_consumption.fats_consumed' },
          avg_rating: { $avg: '$rating' }
        }
      }
    ]);

    const result = stats[0] || {
      total_meals: 0,
      consumed_meals: 0,
      skipped_meals: 0,
      total_calories: 0,
      total_protein: 0,
      total_carbs: 0,
      total_fats: 0,
      avg_rating: 0
    };

    return res.status(200).json({
      success: true,
      message: 'Meal statistics retrieved successfully',
      data: {
        ...result,
        completion_rate: result.total_meals > 0 
          ? Math.round((result.consumed_meals / result.total_meals) * 100) 
          : 0
      }
    });
  } catch (error) {
    next(error);
    return;
  }
};

/**
 * @route   PATCH /api/v1/meals/:mealId
 * @desc    Update meal details
 * @access  Private
 */
export const updateMeal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const mealId = req.params.mealId;
    const { notes, rating } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID not found' });
    }

    const meal = await Meal.findOne({
      _id: mealId,
      user_id: userId.toString()
    });

    if (!meal) {
      return res.status(404).json({ success: false, message: 'Meal not found' });
    }

    if (notes !== undefined) meal.notes = notes;
    if (rating !== undefined) meal.rating = rating;

    await meal.save();

    return res.status(200).json({
      success: true,
      message: 'Meal updated successfully',
      data: meal
    });
  } catch (error) {
    next(error);
    return;
  }
}; 