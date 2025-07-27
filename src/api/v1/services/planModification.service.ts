import { Plan } from '@/models/plan.model';
import { Workout, IWorkout } from '@/models/workout.model';
import { Meal, IMeal } from '@/models/meal.model';
import { User } from '@/models/user.model';

interface PlanModificationRequest {
  planId: string;
  userId: string;
  modifications: {
    workouts?: {
      weekNumber: number;
      dayNumber: number;
      exercises: {
        name: string;
        sets: number;
        reps: string;
        rest_seconds: number;
        muscle_groups: string[];
      }[];
    }[];
    meals?: {
      weekNumber: number;
      dayNumber: number;
      mealType: 'breakfast' | 'morning_snack' | 'lunch' | 'afternoon_snack' | 'dinner';
      mealData: {
        name: string;
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
        ingredients: string[];
        prep_time_minutes: number;
        instructions?: string;
      };
    }[];
  };
}

/**
 * Update specific workouts in the plan
 */
const updateWorkouts = async (
  userId: string,
  planId: string,
  workoutModifications: PlanModificationRequest['modifications']['workouts']
): Promise<{ updated: number; created: number }> => {
  let updated = 0;
  let created = 0;

  if (!workoutModifications) return { updated, created };

  for (const modification of workoutModifications) {
    // Find existing workout
    const existingWorkout = await Workout.findOne({
      user_id: userId,
      plan_id: planId,
      week_number: modification.weekNumber,
      day_number: modification.dayNumber
    });

    if (existingWorkout) {
      // Update existing workout
      existingWorkout.exercises = modification.exercises.map(exercise => ({
        ...exercise,
        completed_sets: 0 // Reset completed sets for new exercises
      }));
      existingWorkout.total_duration_minutes = calculateWorkoutDuration(modification.exercises);
      existingWorkout.notes = `Modified workout - Week ${modification.weekNumber}, Day ${modification.dayNumber}`;
      await existingWorkout.save();
      updated++;
    } else {
      // Create new workout if it doesn't exist
      const workoutDate = calculateWorkoutDate(planId, modification.weekNumber, modification.dayNumber);
      const newWorkout = new Workout({
        user_id: userId,
        plan_id: planId,
        day_number: modification.dayNumber,
        week_number: modification.weekNumber,
        workout_date: workoutDate,
        status: 'pending',
        exercises: modification.exercises.map(exercise => ({
          ...exercise,
          completed_sets: 0
        })),
        total_duration_minutes: calculateWorkoutDuration(modification.exercises),
        notes: `Created workout - Week ${modification.weekNumber}, Day ${modification.dayNumber}`
      });
      await newWorkout.save();
      created++;
    }
  }

  return { updated, created };
};

/**
 * Update specific meals in the plan
 */
const updateMeals = async (
  userId: string,
  planId: string,
  mealModifications: PlanModificationRequest['modifications']['meals']
): Promise<{ updated: number; created: number }> => {
  let updated = 0;
  let created = 0;

  if (!mealModifications) return { updated, created };

  for (const modification of mealModifications) {
    // Find existing meal
    const existingMeal = await Meal.findOne({
      user_id: userId,
      plan_id: planId,
      week_number: modification.weekNumber,
      day_number: modification.dayNumber,
      meal_type: modification.mealType
    });

    if (existingMeal) {
      // Update existing meal
      existingMeal.meal_data = modification.mealData;
      existingMeal.notes = `Modified meal - Week ${modification.weekNumber}, Day ${modification.dayNumber}, ${modification.mealType}`;
      await existingMeal.save();
      updated++;
    } else {
      // Create new meal if it doesn't exist
      const mealDate = calculateMealDate(planId, modification.weekNumber, modification.dayNumber);
      const newMeal = new Meal({
        user_id: userId,
        plan_id: planId,
        day_number: modification.dayNumber,
        week_number: modification.weekNumber,
        meal_date: mealDate,
        meal_type: modification.mealType,
        status: 'pending',
        meal_data: modification.mealData
      });
      await newMeal.save();
      created++;
    }
  }

  return { updated, created };
};

/**
 * Calculate workout date based on plan start date
 */
const calculateWorkoutDate = (planId: string, weekNumber: number, dayNumber: number): Date => {
  // This is a simplified calculation - in a real implementation,
  // you'd want to get the actual plan start date from the database
  const today = new Date();
  const startDate = new Date(today);
  
  // Calculate the date for this specific workout
  const daysOffset = (weekNumber - 1) * 7 + (dayNumber - 1);
  startDate.setDate(today.getDate() + daysOffset);
  
  return startDate;
};

/**
 * Calculate meal date based on plan start date
 */
const calculateMealDate = (planId: string, weekNumber: number, dayNumber: number): Date => {
  // Similar to workout date calculation
  const today = new Date();
  const startDate = new Date(today);
  
  const daysOffset = (weekNumber - 1) * 7 + (dayNumber - 1);
  startDate.setDate(today.getDate() + daysOffset);
  
  return startDate;
};

/**
 * Calculate estimated workout duration based on exercises
 */
const calculateWorkoutDuration = (exercises: any[]): number => {
  let totalDuration = 0;
  
  for (const exercise of exercises) {
    // Estimate 2 minutes per set (including rest time)
    const exerciseTime = exercise.sets * 2;
    totalDuration += exerciseTime;
  }
  
  // Add 10 minutes for warm-up and cool-down
  return totalDuration + 10;
};

/**
 * Modify an active plan with new workouts and/or meals
 */
export const modifyPlan = async (request: PlanModificationRequest): Promise<{
  success: boolean;
  message: string;
  modifications: {
    workouts: { updated: number; created: number };
    meals: { updated: number; created: number };
  };
}> => {
  try {
    const { planId, userId, modifications } = request;

    // Verify the plan exists and belongs to the user
    const plan = await Plan.findOne({ _id: planId, user: userId });
    if (!plan) {
      throw new Error('Plan not found or does not belong to user');
    }

    // Check if plan is active
    if (plan.status !== 'active') {
      throw new Error('Can only modify active plans');
    }

    // Update workouts if provided
    const workoutResults = await updateWorkouts(userId, planId, modifications.workouts);

    // Update meals if provided
    const mealResults = await updateMeals(userId, planId, modifications.meals);

    return {
      success: true,
      message: 'Plan modified successfully',
      modifications: {
        workouts: workoutResults,
        meals: mealResults
      }
    };

  } catch (error) {
    console.error('Error modifying plan:', error);
    throw error;
  }
};

/**
 * Get plan modification history
 */
export const getPlanModificationHistory = async (planId: string, userId: string): Promise<{
  workouts: IWorkout[];
  meals: IMeal[];
}> => {
  try {
    // Get all workouts and meals for this plan
    const workouts = await Workout.find({
      user_id: userId,
      plan_id: planId
    }).sort({ week_number: 1, day_number: 1 });

    const meals = await Meal.find({
      user_id: userId,
      plan_id: planId
    }).sort({ week_number: 1, day_number: 1, meal_type: 1 });

    return { workouts, meals };
  } catch (error) {
    console.error('Error getting plan modification history:', error);
    throw error;
  }
}; 