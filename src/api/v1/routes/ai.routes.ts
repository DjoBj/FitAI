import { Router } from 'express';
import { generatePlan } from '../controllers/ai/generatePlan.controller';
import { confirmPlan } from '../controllers/ai/confirmPlan.controller';
import { chatWithAI } from '../controllers/ai/chat.controller';
import { getMyPlan, getAllPlans } from '../controllers/ai/getPlan.controller';
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

export default router;