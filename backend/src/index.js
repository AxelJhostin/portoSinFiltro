import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import denunciasRouter from './routes/denuncias.js';
import aportesRouter from './routes/aportes.js';
import dashboardRouter from './routes/dashboard.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (_, res) => res.json({ ok: true }));

app.use('/denuncias', denunciasRouter);
// Aportes montados bajo /denuncias/:id/aportes (mismo router de denuncias maneja el param)
app.use('/denuncias', aportesRouter);
app.use('/dashboard', dashboardRouter);

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`PortoSinFiltro API corriendo en http://localhost:${PORT}`);
});
