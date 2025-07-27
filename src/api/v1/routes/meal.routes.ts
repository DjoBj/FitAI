import { Router } from 'express';
import {
  getDailyMeals,
  getWeeklyMeals,
  prepareMeal,
  consumeMeal,
  skipMeal,
  getWeeklyNutritionSummary,
  getMealHistory,
  getMealStats,
  updateMeal
} from '../controllers/meal.controller';
import { AuthMiddleware } from '@/middleware/auth';

const router = Router();

// Protect all meal routes with authentication
router.use(AuthMiddleware.authenticate);

// GET /api/v1/meals/daily/:dayNumber
router.get('/daily/:dayNumber', getDailyMeals);

// GET /api/v1/meals/weekly/:weekNumber
router.get('/weekly/:weekNumber', getWeeklyMeals);

// POST /api/v1/meals/prepare/:mealId
router.post('/prepare/:mealId', prepareMeal);

// POST /api/v1/meals/consume/:mealId
router.post('/consume/:mealId', consumeMeal);

// POST /api/v1/meals/skip/:mealId
router.post('/skip/:mealId', skipMeal);

// GET /api/v1/meals/nutrition-summary/:weekNumber
router.get('/nutrition-summary/:weekNumber', getWeeklyNutritionSummary);

// GET /api/v1/meals/history
router.get('/history', getMealHistory);

// GET /api/v1/meals/stats
router.get('/stats', getMealStats);

// PATCH /api/v1/meals/:mealId
router.patch('/:mealId', updateMeal);

export default router; 