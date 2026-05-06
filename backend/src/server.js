const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const { sequelize, initPostGIS } = require('./shared/database/sequelize');
const { defineAssociations } = require('./shared/database/models');
const { errorHandler } = require('./shared/middleware');
const { initCronJobs } = require('./jobs/scheduler');

// Route imports
const userRoutes = require('./modules/user/user.routes');
const subscriptionRoutes = require('./modules/subscription/subscription.routes');
const recommendationRoutes = require('./modules/recommendation/recommendation.routes');
const orderRoutes = require('./modules/order/order.routes');
const veterinaryRoutes = require('./modules/veterinary/veterinary.routes');
const healthRecordRoutes = require('./modules/health-record/healthRecord.routes');

const app = express();

// ============================================================
//  MIDDLEWARE
// ============================================================
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: config.app.corsOrigin,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(config.app.env === 'development' ? 'dev' : 'combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, error: 'Too many requests, please try again later' },
});
app.use(`/api/${config.app.apiVersion}`, limiter);

// ============================================================
//  ROUTES
// ============================================================
const apiBase = `/api/${config.app.apiVersion}`;

app.use(`${apiBase}/users`, userRoutes);
app.use(`${apiBase}/subscriptions`, subscriptionRoutes);
app.use(`${apiBase}/recommendations`, recommendationRoutes);
app.use(`${apiBase}/orders`, orderRoutes);
app.use(`${apiBase}/veterinary`, veterinaryRoutes);
app.use(`${apiBase}/health-records`, healthRecordRoutes);

// Health check — Cloud Run uses this to verify the container is alive
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'PawPati API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: config.app.env,
    database: _req.app.locals.dbReady ? 'connected' : 'disconnected',
    redis: _req.app.locals.redis ? 'connected' : 'unavailable',
  });
});

// API docs redirect
app.get('/', (_req, res) => {
  res.json({
    message: '🐾 Welcome to PawPati API',
    version: config.app.apiVersion,
    docs: `${config.app.url}/api/docs`,
    health: `${config.app.url}/health`,
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    code: 'NOT_FOUND',
  });
});

// Error handler
app.use(errorHandler);

// ============================================================
//  SERVER INITIALIZATION
// ============================================================
async function startServer() {
  // ============================================================
  // CRITICAL: Start HTTP server FIRST so Cloud Run sees port 8080
  // Database and Redis connections happen AFTER the port is open.
  // ============================================================

  // Define model associations (no DB call, just schema wiring)
  defineAssociations();

  const server = app.listen(config.app.port, () => {
    console.log(`🐾 PawPati API listening on port ${config.app.port} [${config.app.env}]`);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n🔻 ${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      try { await sequelize.close(); } catch (_) {}
      if (app.locals.redis) try { await app.locals.redis.quit(); } catch (_) {}
      console.log('👋 Server shut down complete');
      process.exit(0);
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // ============================================================
  // Now try to connect to backing services (non-blocking)
  // ============================================================

  // PostgreSQL
  try {
    console.log('🔌 Connecting to PostgreSQL...');
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');
    await initPostGIS();
    if (config.app.env === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ Database synced (alter mode)');
    }
    app.locals.dbReady = true;
  } catch (dbError) {
    console.error('⚠️ PostgreSQL connection failed (server still running):', dbError.message);
    app.locals.dbReady = false;
  }

  // Redis (optional)
  try {
    const Redis = require('ioredis');
    const redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      keyPrefix: config.redis.keyPrefix,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
    await redis.connect();
    redis.on('connect', () => console.log('✅ Redis connected'));
    redis.on('error', (err) => console.warn('⚠️ Redis error (non-critical):', err.message));
    app.locals.redis = redis;
  } catch (redisError) {
    console.warn('⚠️ Redis not available, running without cache');
    app.locals.redis = null;
  }

  // Cron jobs
  try {
    initCronJobs();
  } catch (cronError) {
    console.warn('⚠️ Cron jobs init failed:', cronError.message);
  }
}

startServer();

module.exports = app;

