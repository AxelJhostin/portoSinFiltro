-- ============================================================
-- PortoSinFiltro — Schema PostgreSQL (Supabase)
-- Ejecutar en Supabase > SQL Editor
-- ============================================================

-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- 1. PERFILES (extiende auth.users de Supabase)
-- ─────────────────────────────────────────────
CREATE TABLE perfiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre        TEXT NOT NULL,
  rol           TEXT NOT NULL CHECK (rol IN ('ciudadano', 'cuadrilla', 'municipio')),
  activo        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 2. CATEGORÍAS
-- ─────────────────────────────────────────────
CREATE TABLE categorias (
  id       SERIAL PRIMARY KEY,
  slug     TEXT NOT NULL UNIQUE,   -- 'baches_vias', 'alumbrado', etc.
  nombre   TEXT NOT NULL
);

INSERT INTO categorias (slug, nombre) VALUES
  ('baches_vias',  'Baches y vías'),
  ('alumbrado',    'Alumbrado público'),
  ('basura',       'Basura y aseo'),
  ('agua',         'Agua y alcantarillado'),
  ('semaforos',    'Semáforos y señalética'),
  ('parques',      'Parques y espacios públicos'),
  ('seguridad',    'Seguridad'),
  ('ruido',        'Ruido'),
  ('otros',        'Otros');

-- ─────────────────────────────────────────────
-- 3. ZONAS
-- ─────────────────────────────────────────────
CREATE TABLE zonas (
  id      SERIAL PRIMARY KEY,
  nombre  TEXT NOT NULL UNIQUE
);

INSERT INTO zonas (nombre) VALUES
  ('Andrés de Vera'),
  ('Picoazá'),
  ('4 de Noviembre'),
  ('San Pablo'),
  ('El Florón'),
  ('Colón'),
  ('La Pradera'),
  ('Ciudad Nueva'),
  ('Ciudadela Universitaria'),
  ('Otra zona');

-- ─────────────────────────────────────────────
-- 4. DENUNCIAS
-- ─────────────────────────────────────────────
CREATE TABLE denuncias (
  id            SERIAL PRIMARY KEY,
  autor_id      UUID NOT NULL REFERENCES perfiles(id),
  anonima       BOOLEAN NOT NULL DEFAULT false,
  categoria_id  INTEGER NOT NULL REFERENCES categorias(id),
  zona_id       INTEGER NOT NULL REFERENCES zonas(id),
  descripcion   TEXT NOT NULL,
  gravedad      SMALLINT NOT NULL CHECK (gravedad BETWEEN 1 AND 5),
  latitud       DOUBLE PRECISION,        -- ubicación en el mapa (opcional)
  longitud      DOUBLE PRECISION,
  titular       TEXT NOT NULL,           -- auto-generado en el backend
  estado        TEXT NOT NULL DEFAULT 'pendiente'
                  CHECK (estado IN ('pendiente', 'en_proceso', 'resuelto')),
  cuadrilla_id  UUID REFERENCES perfiles(id),  -- asignada por municipio
  oculta        BOOLEAN NOT NULL DEFAULT false, -- moderación
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_denuncias_updated_at
  BEFORE UPDATE ON denuncias
  FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

-- ─────────────────────────────────────────────
-- 5. FOTOS DE DENUNCIA
-- ─────────────────────────────────────────────
CREATE TABLE fotos_denuncia (
  id            SERIAL PRIMARY KEY,
  denuncia_id   INTEGER NOT NULL REFERENCES denuncias(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  subida_por    UUID NOT NULL REFERENCES perfiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 6. APORTES (confirmaciones, evidencia, comentarios)
-- ─────────────────────────────────────────────
CREATE TABLE aportes (
  id            SERIAL PRIMARY KEY,
  denuncia_id   INTEGER NOT NULL REFERENCES denuncias(id) ON DELETE CASCADE,
  autor_id      UUID NOT NULL REFERENCES perfiles(id),
  anonimo       BOOLEAN NOT NULL DEFAULT false,
  tipo          TEXT NOT NULL
                  CHECK (tipo IN ('confirmacion', 'evidencia', 'detalle', 'relacionado')),
  contenido     TEXT,
  foto_url      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 7. REACCIONES (apoyo)
-- ─────────────────────────────────────────────
CREATE TABLE reacciones (
  id            SERIAL PRIMARY KEY,
  denuncia_id   INTEGER NOT NULL REFERENCES denuncias(id) ON DELETE CASCADE,
  usuario_id    UUID NOT NULL REFERENCES perfiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (denuncia_id, usuario_id)   -- un apoyo por usuario por denuncia
);

-- ─────────────────────────────────────────────
-- 7b. VALORACIONES DE PROGRESO (ciudadanos)
-- ─────────────────────────────────────────────
CREATE TABLE valoraciones_progreso (
  id            SERIAL PRIMARY KEY,
  denuncia_id   INTEGER NOT NULL REFERENCES denuncias(id) ON DELETE CASCADE,
  usuario_id    UUID NOT NULL REFERENCES perfiles(id),
  progresando   BOOLEAN NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (denuncia_id, usuario_id)
);

-- ─────────────────────────────────────────────
-- 8. HISTORIAL DE ESTADOS
-- ─────────────────────────────────────────────
CREATE TABLE historial_estados (
  id               SERIAL PRIMARY KEY,
  denuncia_id      INTEGER NOT NULL REFERENCES denuncias(id) ON DELETE CASCADE,
  estado_anterior  TEXT,
  estado_nuevo     TEXT NOT NULL,
  cambiado_por     UUID NOT NULL REFERENCES perfiles(id),
  respuesta        TEXT,   -- respuesta oficial de cuadrilla/municipio
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- VISTAS ÚTILES
-- ─────────────────────────────────────────────

-- Vista: denuncia con datos enriquecidos (para el Muro)
CREATE VIEW vista_denuncias AS
SELECT
  d.id,
  d.anonima,
  CASE WHEN d.anonima THEN NULL ELSE d.autor_id END AS autor_id,
  CASE WHEN d.anonima THEN 'Ciudadano Anónimo' ELSE p.nombre END AS autor_nombre,
  d.categoria_id,
  d.zona_id,
  c.nombre AS categoria,
  c.slug   AS categoria_slug,
  z.nombre AS zona,
  d.descripcion,
  d.gravedad,
  d.latitud,
  d.longitud,
  d.titular,
  d.estado,
  d.oculta,
  d.created_at,
  d.updated_at,
  EXTRACT(DAY FROM NOW() - d.created_at)::INTEGER AS dias_sin_resolver,
  COUNT(DISTINCT r.id)  AS total_apoyos,
  COUNT(DISTINCT a.id)  AS total_aportes,
  COUNT(DISTINCT f.id)  AS total_fotos,
  COUNT(DISTINCT CASE WHEN vp.progresando = true  THEN vp.id END) AS total_progreso_si,
  COUNT(DISTINCT CASE WHEN vp.progresando = false THEN vp.id END) AS total_progreso_no,
  (
    SELECT f2.url
    FROM fotos_denuncia f2
    WHERE f2.denuncia_id = d.id
    ORDER BY f2.created_at ASC
    LIMIT 1
  ) AS foto_portada
FROM denuncias d
  JOIN perfiles   p ON p.id = d.autor_id
  JOIN categorias c ON c.id = d.categoria_id
  JOIN zonas      z ON z.id = d.zona_id
  LEFT JOIN reacciones  r ON r.denuncia_id = d.id
  LEFT JOIN aportes     a ON a.denuncia_id = d.id
  LEFT JOIN fotos_denuncia f ON f.denuncia_id = d.id
  LEFT JOIN valoraciones_progreso vp ON vp.denuncia_id = d.id
WHERE d.oculta = false
GROUP BY d.id, p.nombre, c.nombre, c.slug, z.nombre;

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY (segunda capa de seguridad)
-- La primera capa es el backend. RLS actúa como red de seguridad.
-- ─────────────────────────────────────────────
ALTER TABLE perfiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE denuncias       ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotos_denuncia  ENABLE ROW LEVEL SECURITY;
ALTER TABLE aportes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE reacciones      ENABLE ROW LEVEL SECURITY;
ALTER TABLE valoraciones_progreso ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_estados ENABLE ROW LEVEL SECURITY;

-- El backend usa la service_role key (bypassa RLS), así que
-- aquí solo necesitamos la política básica de lectura pública.
CREATE POLICY "lectura_publica_denuncias" ON denuncias
  FOR SELECT USING (oculta = false);

CREATE POLICY "lectura_publica_aportes" ON aportes
  FOR SELECT USING (true);

-- El frontend (con la anon/publishable key) necesita leer el perfil del
-- usuario logueado para conocer su nombre y rol.
CREATE POLICY "usuarios_ven_su_perfil" ON perfiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- ─────────────────────────────────────────────
-- REGISTRO DE CIUDADANOS (auto-perfil)
-- Al crearse un usuario en auth.users (vía signUp desde la app),
-- se crea automáticamente su perfil con rol 'ciudadano'.
-- Los roles 'cuadrilla' y 'municipio' se asignan manualmente.
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre, rol)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'nombre', ''), split_part(NEW.email, '@', 1)),
    'ciudadano'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────
-- STORAGE — bucket público para fotos de denuncias
-- El backend sube con la service_role key (bypassa RLS).
-- El bucket es público para que las URLs de las fotos se vean sin token.
-- ─────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('denuncias', 'denuncias', true)
ON CONFLICT (id) DO NOTHING;
