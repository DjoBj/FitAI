import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AuthMiddleware } from '../middleware/auth';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', AuthMiddleware.authenticate, AuthController.logout);
router.post('/refresh', AuthController.refreshToken);

export default router;