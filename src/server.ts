import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env';
import { database } from './config/database';
import { ErrorHandler } from './middleware/errorHandler';
import { RateLimiter } from './middleware/rateLimiter';

// Import v1 routes
import aiRoutes from './api/v1/routes/ai.routes';
import progressRoutes from './api/v1/routes/progress.routes';
import workoutRoutes from './api/v1/routes/workout.routes';
import mealRoutes from './api/v1/routes/meal.routes';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import profileSetupRoutes from './routes/profileSetup.routes';

class FitAIServer {
  private app: Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = config.PORT;

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false
    }));

    this.app.use(cors({
      origin: config.CORS_ORIGIN,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      maxAge: 86400
    }));

    this.app.use('/api/', RateLimiter.general);
    this.app.use('/api/auth/', RateLimiter.auth);

    this.app.use(express.json({ limit: '10mb', type: 'application/json' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    if (config.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    this.app.use((req, res, next) => {
      req.requestTime = new Date().toISOString();
      req.requestId = Math.random().toString(36).substring(2, 15);
      next();
    });
  }

  private initializeRoutes(): void {
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'FitAI Backend is running successfully',
        data: {
          service: 'FitAI Backend API',
          version: '1.0.0',
          environment: config.NODE_ENV,
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          database: database.isConnectionActive() ? 'connected' : 'disconnected'
        }
      });
    });

    this.app.get('/api', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Welcome to FitAI API',
        data: {
          service: 'FitAI Backend API',
          version: '1.0.0',
          documentation: '/api/docs',
          endpoints: {
            auth: '/api/auth',
            health: '/health'
          }
        }
      });
    });

    // Core routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/user', userRoutes);
    this.app.use('/api/profile', profileSetupRoutes);

    // Versioned API
    this.app.use('/api/v1/ai', aiRoutes);
    this.app.use('/api/v1/progress', progressRoutes);
    this.app.use('/api/v1/workouts', workoutRoutes);
    this.app.use('/api/v1/meals', mealRoutes);

    this.app.get('/api/docs', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'FitAI API Documentation',
        data: {
          version: '1.0.0',
          baseUrl: `${req.protocol}://${req.get('host')}/api`,
          endpoints: {
            authentication: {
              register: 'POST /auth/register',
              login: 'POST /auth/login',
              profile: 'GET /user/profile',
              updateProfile: 'PATCH /user/profile',
              logout: 'POST /auth/logout',
              refresh: 'POST /auth/refresh'
            },
            profileSetup: {
              setup: 'POST /profile/setup'
            },
            ai: {
              generate: 'POST /v1/ai/generate-plan',
              myPlan: 'GET /v1/ai/my-plan',
              allPlans: 'GET /v1/ai/plans',
              confirm: 'POST /v1/ai/confirm-plan/:id',
              chat: 'POST /v1/ai/chat'
            },
            workouts: {
              daily: 'GET /v1/workouts/daily/:dayNumber',
              weekly: 'GET /v1/workouts/weekly/:weekNumber',
              start: 'POST /v1/workouts/start/:workoutId',
              complete: 'POST /v1/workouts/complete/:workoutId',
              skip: 'POST /v1/workouts/skip/:workoutId',
              exercise: 'PATCH /v1/workouts/exercise/:workoutId/:exerciseIndex',
              history: 'GET /v1/workouts/history',
              stats: 'GET /v1/workouts/stats'
            },
            meals: {
              daily: 'GET /v1/meals/daily/:dayNumber',
              weekly: 'GET /v1/meals/weekly/:weekNumber',
              prepare: 'POST /v1/meals/prepare/:mealId',
              consume: 'POST /v1/meals/consume/:mealId',
              skip: 'POST /v1/meals/skip/:mealId',
              nutritionSummary: 'GET /v1/meals/nutrition-summary/:weekNumber',
              history: 'GET /v1/meals/history',
              stats: 'GET /v1/meals/stats',
              update: 'PATCH /v1/meals/:mealId'
            },
            progress: {
              current: 'GET /v1/progress/current',
              complete: 'POST /v1/progress/complete',
              history: 'GET /v1/progress/history',
              shiftDay: 'POST /v1/progress/day/:direction'
            }
          }
        }
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(ErrorHandler.notFound);
    this.app.use(ErrorHandler.handle);
  }

  public async start(): Promise<void> {
    try {
      await database.connect();
      this.app.listen(this.port, () => {
        console.log('🚀 FitAI Backend Server Started Successfully!');
        console.log('=====================================');
        console.log(`📍 Server running on: http://localhost:${this.port}`);
        console.log(`🌍 Environment: ${config.NODE_ENV}`);
        console.log(`📊 Health check: http://localhost:${this.port}/health`);
        console.log(`📚 API docs: http://localhost:${this.port}/api/docs`);
        console.log(`🔐 Auth endpoints: http://localhost:${this.port}/api/auth`);
        console.log('=====================================');
      });
      this.setupGracefulShutdown();
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      console.log(`
🛑 Received ${signal}. Starting graceful shutdown...`);
      try {
        await database.disconnect();
        console.log('✅ Database disconnected successfully');
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });
  }

  public getApp(): Application {
    return this.app;
  }
}

declare global {
  namespace Express {
    interface Request {
      requestTime?: string;
      requestId?: string;
    }
  }
}

if (require.main === module) {
  const server = new FitAIServer();
  server.start().catch((error) => {
    console.error('❌ Failed to start FitAI server:', error);
    process.exit(1);
  });
}

export { FitAIServer };
