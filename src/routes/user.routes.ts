import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { AuthMiddleware } from '../middleware/auth';

const router = Router();

router.get('/profile', AuthMiddleware.authenticate, UserController.getProfile);
router.patch('/profile', AuthMiddleware.authenticate, UserController.updateProfile);

export default router;