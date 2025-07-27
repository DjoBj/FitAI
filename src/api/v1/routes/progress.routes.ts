import { Router } from 'express';
import {
  getCurrentProgress,
  completeToday,
  getHistory,
  shiftDay
} from '../controllers/progress.controller';
import { AuthMiddleware } from '@/middleware/auth';

const router = Router();

router.use(AuthMiddleware.authenticate);

router.get('/current', getCurrentProgress);
router.post('/complete', completeToday);
router.get('/history', getHistory);
router.post('/day/:direction', shiftDay); // direction = forward | backward

export default router;
