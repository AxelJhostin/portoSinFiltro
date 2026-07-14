-- ============================================================
-- PortoSinFiltro — Realtime para el muro (Supabase)
-- Ejecutar en Supabase → SQL Editor (proyecto ya desplegado)
-- ============================================================
--
-- El muro se refresca vía Realtime escuchando cambios en tablas base.
-- Realtime respeta RLS: hace falta SELECT público en tablas sin policy previa.

-- Políticas de lectura para anon/authenticated (Realtime + RLS)
DROP POLICY IF EXISTS "lectura_publica_reacciones" ON reacciones;
CREATE POLICY "lectura_publica_reacciones" ON reacciones
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "lectura_publica_valoraciones" ON valoraciones_progreso;
CREATE POLICY "lectura_publica_valoraciones" ON valoraciones_progreso
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "lectura_publica_fotos" ON fotos_denuncia;
CREATE POLICY "lectura_publica_fotos" ON fotos_denuncia
  FOR SELECT USING (true);

-- denuncias y aportes ya tienen lectura_publica_* en schema.sql

-- Añadir tablas a la publicación Realtime (idempotente)
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'denuncias',
    'reacciones',
    'valoraciones_progreso',
    'aportes',
    'fotos_denuncia'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    END IF;
  END LOOP;
END $$;
