import { Router } from 'express';
import { generatePlan } from '../controllers/ai/generatePlan.controller';
import { confirmPlan } from '../controllers/ai/confirmPlan.controller';
import { chatWithAI } from '../controllers/ai/chat.controller';
import { getMyPlan, getAllPlans } from '../controllers/ai/getPlan.controller';
import { getSchedule } from '../controllers/ai/getSchedule.controller';
import { modifyPlanController, getPlanHistory } from '../controllers/ai/modifyPlan.controller';
import { AuthMiddleware } from '@/middleware/auth';

const router = Router();

// Protect all AI routes with authentication
router.use(AuthMiddleware.authenticate);

// POST /api/v1/ai/generate-plan
router.post('/generate-plan', generatePlan);

// POST /api/v1/ai/confirm-plan/:id
router.post('/confirm-plan/:id', confirmPlan);

// GET /api/v1/ai/my-plan
router.get('/my-plan', getMyPlan);

// GET /api/v1/ai/plans
router.get('/plans', getAllPlans);

// POST /api/v1/ai/chat
router.post('/chat', chatWithAI);

// GET /api/v1/ai/schedule
router.get('/schedule', getSchedule);

// PUT /api/v1/ai/modify-plan/:id
router.put('/modify-plan/:id', modifyPlanController);

// GET /api/v1/ai/modify-plan/:id/history
router.get('/modify-plan/:id/history', getPlanHistory);

export default router;