import { Router } from 'express';
import { FitnessProfileController } from '../controllers/fitnessProfile.controller';
import { AuthMiddleware } from '../middleware/auth';

const router = Router();

router.get(
  '/',
  AuthMiddleware.authenticate,
  FitnessProfileController.getProfile
);

router.post(
  '/',
  AuthMiddleware.authenticate,
  FitnessProfileController.upsertProfile
);

export default router;