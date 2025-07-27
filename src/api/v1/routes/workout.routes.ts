import { Router } from 'express';
import {
  getDailyWorkout,
  getWeeklyWorkouts,
  startWorkout,
  completeWorkout,
  skipWorkout,
  updateExerciseCompletion,
  getWorkoutHistory,
  getWorkoutStats
} from '../controllers/workout.controller';
import { AuthMiddleware } from '@/middleware/auth';

const router = Router();

// Protect all workout routes with authentication
router.use(AuthMiddleware.authenticate);

// GET /api/v1/workouts/daily/:dayNumber
router.get('/daily/:dayNumber', getDailyWorkout);

// GET /api/v1/workouts/weekly/:weekNumber
router.get('/weekly/:weekNumber', getWeeklyWorkouts);

// POST /api/v1/workouts/start/:workoutId
router.post('/start/:workoutId', startWorkout);

// POST /api/v1/workouts/complete/:workoutId
router.post('/complete/:workoutId', completeWorkout);

// POST /api/v1/workouts/skip/:workoutId
router.post('/skip/:workoutId', skipWorkout);

// PATCH /api/v1/workouts/exercise/:workoutId/:exerciseIndex
router.patch('/exercise/:workoutId/:exerciseIndex', updateExerciseCompletion);

// GET /api/v1/workouts/history
router.get('/history', getWorkoutHistory);

// GET /api/v1/workouts/stats
router.get('/stats', getWorkoutStats);

export default router; 