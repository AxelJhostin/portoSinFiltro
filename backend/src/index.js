import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import denunciasRouter from './routes/denuncias.js';
import aportesRouter from './routes/aportes.js';
import dashboardRouter from './routes/dashboard.js';

// ─── Validar variables de entorno obligatorias antes de arrancar ─────────────
const REQUIRED_ENV = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`\n❌ Variables de entorno faltantes: ${missing.join(', ')}`);
  console.error('   Copia backend/.env.example a backend/.env y completa los valores.\n');
  process.exit(1);
}

const app  = express();
const PORT = process.env.PORT || 4000;

// ─── Seguridad HTTP ──────────────────────────────────────────────────────────
app.use(helmet());

// Rate limiting global: 100 req / 15 min por IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones. Intenta de nuevo en 15 minutos.' },
}));

// Rate limiting estricto para escrituras: 20 req / 15 min por IP
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Límite de escritura alcanzado. Intenta de nuevo en 15 minutos.' },
});

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '1mb' }));

// ─── Rutas ───────────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.use('/denuncias', denunciasRouter);
app.use('/denuncias', writeLimiter, aportesRouter);   // escrituras de aportes limitadas
app.use('/dashboard', dashboardRouter);

// ─── Error handler global ────────────────────────────────────────────────────
// Captura errores lanzados con next(err) o en middlewares síncronos
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('[error]', err?.message ?? err);
  res.status(err.status ?? 500).json({
    error: err.message ?? 'Error interno del servidor',
  });
});

app.listen(PORT, () => {
  console.log(`✅ PortoSinFiltro API corriendo en http://localhost:${PORT}`);
});
