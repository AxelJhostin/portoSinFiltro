import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { requireAuth, requireRol } from '../middleware/auth.js';

const router = Router();

// GET /dashboard — Estadísticas para municipio/cuadrilla
router.get('/',
  requireAuth,
  requireRol('municipio', 'cuadrilla'),
  async (req, res) => {
    // Total por estado
    const { data: porEstado } = await supabase
      .from('denuncias')
      .select('estado')
      .eq('oculta', false);

    const conteo = { pendiente: 0, en_proceso: 0, resuelto: 0 };
    porEstado?.forEach(d => { conteo[d.estado]++; });

    // Top zonas con más denuncias
    const { data: topZonas } = await supabase
      .from('vista_denuncias')
      .select('zona')
      .order('created_at', { ascending: false });

    const zonasMap = {};
    topZonas?.forEach(d => {
      zonasMap[d.zona] = (zonasMap[d.zona] || 0) + 1;
    });
    const zonas = Object.entries(zonasMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([zona, total]) => ({ zona, total }));

    // Top categorías
    const { data: topCats } = await supabase
      .from('vista_denuncias')
      .select('categoria');

    const catsMap = {};
    topCats?.forEach(d => {
      catsMap[d.categoria] = (catsMap[d.categoria] || 0) + 1;
    });
    const categorias = Object.entries(catsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([categoria, total]) => ({ categoria, total }));

    // Denuncias de los últimos 7 días (para sparkline)
    const hace7 = new Date();
    hace7.setDate(hace7.getDate() - 6);
    const { data: recientes } = await supabase
      .from('denuncias')
      .select('created_at')
      .gte('created_at', hace7.toISOString())
      .eq('oculta', false);

    const porDia = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(hace7);
      d.setDate(hace7.getDate() + i);
      porDia[d.toISOString().slice(0, 10)] = 0;
    }
    recientes?.forEach(d => {
      const dia = d.created_at.slice(0, 10);
      if (porDia[dia] !== undefined) porDia[dia]++;
    });
    const tendencia = Object.entries(porDia).map(([fecha, total]) => ({ fecha, total }));

    res.json({
      estados: conteo,
      total: conteo.pendiente + conteo.en_proceso + conteo.resuelto,
      zonas,
      categorias,
      tendencia,
    });
  }
);

export default router;
