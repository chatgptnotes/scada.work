import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino';
import path from 'path';

import { createSupabaseClient } from './config/supabase';
import { startSimulator } from './simulator';
import { startHistorian } from './historian';
import { startAlarmEngine } from './alarms';
import { createAPIRouter } from './api';

// Load environment variables from root directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Create logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        }
      : undefined,
});

// Configuration
const PORT = parseInt(process.env.EDGE_SERVER_PORT || '8080', 10);
const DATA_ACQUISITION_INTERVAL = parseInt(
  process.env.DATA_ACQUISITION_INTERVAL || '5000',
  10
);
const SIMULATOR_ENABLED = process.env.SIMULATOR_ENABLED === 'true';

// Create Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url }, 'Incoming request');
  next();
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
  });
});

// API routes
app.use('/api', createAPIRouter());

// Error handling middleware
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    logger.error({ err }, 'Request error');
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
);

// Start server
async function start() {
  try {
    logger.info('Starting SCADA Edge Server...');

    // Initialize Supabase client
    const supabase = createSupabaseClient();
    logger.info('Supabase client initialized');

    // Start simulator if enabled
    if (SIMULATOR_ENABLED) {
      logger.info('Starting simulator...');
      await startSimulator({
        interval: DATA_ACQUISITION_INTERVAL,
        logger,
      });
      logger.info('Simulator started');
    }

    // Start historian
    logger.info('Starting historian...');
    await startHistorian({
      supabase,
      logger,
    });
    logger.info('Historian started');

    // Start alarm engine
    logger.info('Starting alarm engine...');
    await startAlarmEngine({
      supabase,
      logger,
    });
    logger.info('Alarm engine started');

    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`Edge server listening on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`API: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error({ error }, 'Failed to start edge server');
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
start();
