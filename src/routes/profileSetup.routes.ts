import { Router } from 'express';
import { ProfileSetupController } from '../controllers/profileSetup.controller';
import { AuthMiddleware } from '../middleware/auth';

const router = Router();

router.post(
  '/setup',
  AuthMiddleware.authenticate,
  ProfileSetupController.setupFitnessProfile
);

export default router;
