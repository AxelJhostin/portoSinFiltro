-- ============================================================
-- PortoSinFiltro — Migración: una resolución por ciudadano
-- Ejecutar en Supabase → SQL Editor (BD ya desplegada)
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS aportes_una_resolucion_por_usuario
  ON aportes (denuncia_id, autor_id)
  WHERE tipo = 'resolucion';
