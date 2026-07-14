import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import denunciasRouter from './routes/denuncias.js';
import aportesRouter from './routes/aportes.js';
import dashboardRouter from './routes/dashboard.js';
import adminRouter from './routes/admin.js';

export function createApp() {
  const app = express();

  app.use(helmet());

  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiadas peticiones. Intenta de nuevo en 15 minutos.' },
  }));

  const writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Límite de escritura alcanzado. Intenta de nuevo en 15 minutos.' },
  });

  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_, res) => res.json({ ok: true, ts: new Date().toISOString() }));

  app.use('/denuncias', denunciasRouter);
  app.use('/denuncias', writeLimiter, aportesRouter);
  app.use('/dashboard', dashboardRouter);
  app.use('/admin', adminRouter);

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, _next) => {
    console.error('[error]', err?.message ?? err);
    res.status(err.status ?? 500).json({
      error: err.message ?? 'Error interno del servidor',
    });
  });

  return app;
}
