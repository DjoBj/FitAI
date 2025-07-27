import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env';
import { database } from './config/database';
import { ErrorHandler } from './middleware/errorHandler';
import { RateLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import profileRoutes from './routes/profile.routes';
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
    this.app.use(helmet());
    this.app.use(cors({
      origin: config.CORS_ORIGIN,
      credentials: true
    }));
    this.app.use('/api/', RateLimiter.general);
    this.app.use('/api/auth/', RateLimiter.auth);
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(morgan(config.NODE_ENV === 'development' ? 'dev' : 'combined'));
  }

  private initializeRoutes(): void {
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        success: true,
        service: 'FitAI Backend API',
        version: '1.0.0',
        environment: config.NODE_ENV,
        timestamp: new Date().toISOString(),
        database: database.isConnectionActive() ? 'connected' : 'disconnected'
      });
    });

    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/user', userRoutes);
    this.app.use('/api/profile', profileRoutes);
    this.app.use('/api/profile', profileSetupRoutes);
  }

  private initializeErrorHandling(): void {
    this.app.use(ErrorHandler.notFound);
    this.app.use(ErrorHandler.handle);
  }

  public async start(): Promise<void> {
    try {
      await database.connect();
      this.app.listen(this.port, () => {
        console.log(`🚀 FitAI server running on http://localhost:${this.port}`);
      });
    } catch (err) {
      console.error('❌ Failed to start server:', err);
      process.exit(1);
    }
  }

  public getApp(): Application {
    return this.app;
  }
}

if (require.main === module) {
  const server = new FitAIServer();
  server.start().catch((err) => {
    console.error('❌ Server startup error:', err);
    process.exit(1);
  });
}

export { FitAIServer };