import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import approvalRoutes from './routes/approvalRoutes.js';
import handoverRoutes from './routes/handoverRoutes.js';
import incidentRoutes from './routes/incidentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import assistantRoutes from './routes/assistantRoutes.js';
import metaRoutes from './routes/metaRoutes.js';
import userRoutes from './routes/userRoutes.js';

export function createApp(): Express {
  const app = express();

  // Security & logging
  app.use(helmet());
  app.use(
    cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );
  app.use(morgan('dev'));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use('/api', apiLimiter);

  // Root welcome / status endpoint
  app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      service: 'ResourceLoop Core API',
      version: '1.0.0',
      status: 'ONLINE',
      institution: 'Apex University of Technology & Sciences',
      endpoints: {
        health: '/health',
        apiV1: '/api/v1',
        auth: '/api/v1/auth',
        resources: '/api/v1/resources',
        events: '/api/v1/events',
        approvals: '/api/v1/approvals',
        users: '/api/v1/users',
        meta: '/api/v1/meta',
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'ResourceLoop Core API',
      version: '1.0.0',
    });
  });

  // REST API v1 routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/resources', resourceRoutes);
  app.use('/api/v1/events', eventRoutes);
  app.use('/api/v1/approvals', approvalRoutes);
  app.use('/api/v1/handover', handoverRoutes);
  app.use('/api/v1/incidents', incidentRoutes);
  app.use('/api/v1/notifications', notificationRoutes);
  app.use('/api/v1/audit', auditRoutes);
  app.use('/api/v1/analytics', analyticsRoutes);
  app.use('/api/v1/assistant', assistantRoutes);
  app.use('/api/v1/meta', metaRoutes);
  app.use('/api/v1/users', userRoutes);

  // Fallback 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: `API Route not found: ${req.method} ${req.originalUrl}`,
    });
  });

  // Centralized Error handler
  app.use(errorHandler);

  return app;
}
