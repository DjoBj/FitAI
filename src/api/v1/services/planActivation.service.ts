import { Plan } from '@/models/plan.model';
import { Workout, IWorkout } from '@/models/workout.model';
import { Meal, IMeal } from '@/models/meal.model';
import { User } from '@/models/user.model';

interface WorkoutExercise {
  name: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  muscle_groups: string[];
}

interface WorkoutDay {
  day: number;
  dayName: string;
  exercises: WorkoutExercise[];
  isRestDay: boolean;
}

interface WorkoutWeek {
  week: number;
  focus: string;
  days: WorkoutDay[];
}

interface MealData {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  ingredients: string[];
  prep_time_minutes: number;
  instructions?: string;
}

interface DailyMealTemplate {
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;
  meals: {
    breakfast: MealData;
    morning_snack: MealData;
    lunch: MealData;
    afternoon_snack: MealData;
    dinner: MealData;
  };
}

/**
 * Creates workout entries for a specific week
 */
const createWeekWorkouts = async (
  userId: string,
  planId: string,
  weekNumber: number,
  weekData: WorkoutWeek,
  startDate: Date
): Promise<IWorkout[]> => {
  const workouts: IWorkout[] = [];

  for (const dayData of weekData.days) {
    if (dayData.isRestDay) {
      continue; // Skip rest days
    }

    // Calculate the actual date for this workout
    const workoutDate = new Date(startDate);
    workoutDate.setDate(startDate.getDate() + (dayData.day - 1));
    workoutDate.setHours(0, 0, 0, 0); // Ensure it's set to beginning of day

    const workout = new Workout({
      user_id: userId,
      plan_id: planId,
      day_number: dayData.day,
      week_number: weekNumber,
      workout_date: workoutDate,
      status: 'pending',
      exercises: dayData.exercises.map(exercise => ({
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        rest_seconds: exercise.rest_seconds,
        muscle_groups: exercise.muscle_groups,
        completed_sets: 0
      })),
      total_duration_minutes: calculateWorkoutDuration(dayData.exercises),
      notes: `Week ${weekNumber} - ${dayData.dayName} workout`
    });

    workouts.push(workout);
  }

  return workouts;
};

/**
 * Creates meal entries for a specific week
 */
const createWeekMeals = async (
  userId: string,
  planId: string,
  weekNumber: number,
  dailyTemplate: DailyMealTemplate,
  startDate: Date
): Promise<IMeal[]> => {
  const meals: IMeal[] = [];
  const mealTypes = ['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner'] as const;

  // Create meals for each day of the week (7 days)
  for (let dayNumber = 1; dayNumber <= 7; dayNumber++) {
    const mealDate = new Date(startDate);
    mealDate.setDate(startDate.getDate() + (dayNumber - 1));
    mealDate.setHours(0, 0, 0, 0); // Ensure it's set to beginning of day

    for (const mealType of mealTypes) {
      const mealData = dailyTemplate.meals[mealType];
      
      const meal = new Meal({
        user_id: userId,
        plan_id: planId,
        day_number: dayNumber,
        week_number: weekNumber,
        meal_date: mealDate,
        meal_type: mealType,
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

      meals.push(meal);
    }
  }

  return meals;
};

/**
 * Calculate estimated workout duration based on exercises
 */
const calculateWorkoutDuration = (exercises: WorkoutExercise[]): number => {
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
 * Get the start date for the plan (next Monday or today if it's Monday)
 */
const getPlanStartDate = (): Date => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  let startDate: Date;
  
  // If today is Monday, start today. Otherwise, start next Monday
  if (dayOfWeek === 1) {
    startDate = new Date(today);
  } else {
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    startDate = new Date(today);
    startDate.setDate(today.getDate() + daysUntilMonday);
  }
  
  // Set the time to beginning of day (00:00:00)
  startDate.setHours(0, 0, 0, 0);
  return startDate;
};

/**
 * Activate a plan by creating all workouts and meals
 */
export const activatePlan = async (planId: string, userId: string): Promise<{
  success: boolean;
  message: string;
  workoutsCreated: number;
  mealsCreated: number;
  startDate: Date;
}> => {
  try {
    // Find the plan
    const plan = await Plan.findById(planId);
    if (!plan) {
      throw new Error('Plan not found');
    }

    // Verify the plan belongs to the user
    if (plan.user.toString() !== userId) {
      throw new Error('Plan does not belong to user');
    }

    // Check if plan is already active
    if (plan.status === 'active') {
      throw new Error('Plan is already active');
    }

    // Get plan start date
    const startDate = getPlanStartDate();

    // Extract workout and meal data from the plan
    const workoutPlan = plan.workoutPlan;
    const mealPlan = plan.mealPlan;

    if (!workoutPlan?.weeks || !mealPlan?.daily_template) {
      throw new Error('Invalid plan structure - missing workout or meal data');
    }

    const allWorkouts: IWorkout[] = [];
    const allMeals: IMeal[] = [];

    // Create workouts and meals for each week
    for (const weekData of workoutPlan.weeks) {
      const weekStartDate = new Date(startDate);
      weekStartDate.setDate(startDate.getDate() + (weekData.week - 1) * 7);

      // Create workouts for this week
      const weekWorkouts = await createWeekWorkouts(
        userId,
        planId,
        weekData.week,
        weekData,
        weekStartDate
      );
      allWorkouts.push(...weekWorkouts);

      // Create meals for this week
      const weekMeals = await createWeekMeals(
        userId,
        planId,
        weekData.week,
        mealPlan.daily_template,
        weekStartDate
      );
      allMeals.push(...weekMeals);
    }

    // Save all workouts and meals to database
    if (allWorkouts.length > 0) {
      await Workout.insertMany(allWorkouts);
    }

    if (allMeals.length > 0) {
      await Meal.insertMany(allMeals);
    }

    // Update plan status to active
    plan.status = 'active';
    await plan.save();

    // Update user's current plan
    await User.findByIdAndUpdate(userId, { currentPlanId: planId });

    return {
      success: true,
      message: 'Plan activated successfully',
      workoutsCreated: allWorkouts.length,
      mealsCreated: allMeals.length,
      startDate
    };

  } catch (error) {
    console.error('Error activating plan:', error);
    throw error;
  }
};

/**
 * Get upcoming workouts and meals for a user
 */
export const getUpcomingSchedule = async (userId: string, days: number = 7): Promise<{
  workouts: IWorkout[];
  meals: IMeal[];
}> => {
  try {
    // Set start date to beginning of today (00:00:00)
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    
    // Set end date to end of the requested day (23:59:59)
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + days);
    endDate.setHours(23, 59, 59, 999);

    console.log('Schedule query parameters:', {
      userId,
      days,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    const workouts = await Workout.find({
      user_id: userId,
      workout_date: { $gte: startDate, $lte: endDate }
    }).sort({ workout_date: 1, day_number: 1 });

    const meals = await Meal.find({
      user_id: userId,
      meal_date: { $gte: startDate, $lte: endDate }
    }).sort({ meal_date: 1, meal_type: 1 });

    console.log('Schedule query results:', {
      workoutsFound: workouts.length,
      mealsFound: meals.length,
      workoutDates: workouts.map(w => w.workout_date.toISOString()),
      mealDates: meals.map(m => m.meal_date.toISOString())
    });

    return { workouts, meals };
  } catch (error) {
    console.error('Error getting upcoming schedule:', error);
    throw error;
  }
}; 