# PortoSinFiltro — El Muro de la Vergüenza

Plataforma web ciudadana para reportar problemas urbanos en Portoviejo, Manabí. Los ciudadanos denuncian, confirman y dan seguimiento a problemas como baches, alumbrado, basura y más. El municipio y cuadrillas gestionan el estado de cada denuncia desde un panel de control.

> Proyecto universitario — diseño revisado por docentes como "chevere pero demasiado saturado". La paleta fue ajustada a tonos más institucionales sin perder el carácter editorial.

---

## Tabla de contenidos

- [Vista general del proyecto](#vista-general-del-proyecto)
- [Tecnologías](#tecnologías)
- [Arquitectura](#arquitectura)
- [Estructura de carpetas](#estructura-de-carpetas)
- [Configuración inicial](#configuración-inicial)
  - [1. Supabase](#1-supabase)
  - [2. Base de datos](#2-base-de-datos)
  - [3. Backend](#3-backend)
  - [4. Frontend](#4-frontend)
- [Variables de entorno](#variables-de-entorno)
- [Cómo correr el proyecto en local](#cómo-correr-el-proyecto-en-local)
- [Roles de usuario](#roles-de-usuario)
- [API — Endpoints disponibles](#api--endpoints-disponibles)
- [Base de datos — Esquema](#base-de-datos--esquema)
- [Diseño y prototipo](#diseño-y-prototipo)
- [Lo que falta implementar](#lo-que-falta-implementar)
- [Decisiones de diseño importantes](#decisiones-de-diseño-importantes)

---

## Vista general del proyecto

| Módulo | Estado |
|---|---|
| Prototipo interactivo (`index.html`) | ✅ Completo |
| Schema de base de datos (Supabase) | ✅ Completo |
| Backend Node.js/Express | ✅ Scaffold completo |
| Frontend React + Vite + Tailwind | ✅ Scaffold base completo |
| Autenticación con Supabase Auth | ✅ Magic link implementado |
| Página del Muro (lista de denuncias) | ✅ Funcional |
| Página de detalle de denuncia | ⏳ Pendiente |
| Formulario para nueva denuncia | ⏳ Pendiente |
| Panel de municipio/cuadrilla | ⏳ Pendiente |
| Subida de fotos | ⏳ Pendiente |
| Deploy (Vercel + Railway/Render) | ⏳ Pendiente |

---

## Tecnologías

### Frontend
- **React 18** — UI declarativa con hooks
- **Vite** — bundler ultra-rápido para desarrollo
- **Tailwind CSS 3** — utilidades de estilo; paleta personalizada en `tailwind.config.js`
- **React Router v6** — navegación SPA (client-side routing)
- **Supabase JS** — cliente para Auth (magic link) desde el navegador

### Backend
- **Node.js + Express 4** — API REST
- **Supabase JS** (service role) — acceso a la base de datos con permisos de administrador
- **jsonwebtoken** — verificación de tokens JWT emitidos por Supabase Auth
- **express-validator** — validación de entradas en cada ruta
- **multer** — preparado para subida de fotos (aún no conectado)
- **dotenv** — variables de entorno

### Base de datos
- **PostgreSQL en Supabase** — tablas, vistas, triggers, RLS
- **Row Level Security (RLS)** — segunda capa de seguridad (el backend usa service_role que la bypassa, pero protege accesos directos)

---

## Arquitectura

```
Navegador (React)
    │  Supabase Auth (magic link)
    │  fetch /api/*  ──────────────────────────────► Express API
    │                                                      │
    │                                               JWT verify (middleware)
    │                                                      │
    │                                          Supabase service_role client
    │                                                      │
    └─────────────────────────────────────── PostgreSQL (Supabase)
                                                    RLS (segunda capa)
```

El frontend **nunca** habla directamente con la base de datos para operaciones de escritura. Toda mutación pasa por el backend, que verifica el JWT antes de actuar.

---

## Estructura de carpetas

```
portosinfiltro/
├── index.html                  ← Prototipo standalone (demo sin backend)
├── project/                    ← Archivos originales del diseño (Claude Design)
│   ├── PortoSinFiltro.dc.html  ← Prototipo dc-runtime original
│   └── PortoSinFiltro-print.dc.html
│
├── database/
│   ├── schema.sql              ← Schema completo: tablas, trigger, vista, RLS
│   └── seed.sql                ← Datos de prueba (necesita UUIDs reales de Supabase)
│
├── backend/
│   ├── .env.example            ← Variables requeridas (copiar a .env)
│   ├── package.json
│   └── src/
│       ├── index.js            ← Entrada del servidor Express
│       ├── db/
│       │   └── supabase.js     ← Cliente Supabase con service_role
│       ├── middleware/
│       │   └── auth.js         ← requireAuth + requireRol()
│       └── routes/
│           ├── denuncias.js    ← CRUD denuncias + apoyo toggle
│           ├── aportes.js      ← Confirmaciones y comentarios
│           └── dashboard.js    ← Estadísticas para municipio/cuadrilla
│
└── frontend/
    ├── .env.example            ← Variables requeridas (copiar a .env)
    ├── index.html
    ├── package.json
    ├── vite.config.js          ← Proxy /api → localhost:4000
    ├── tailwind.config.js      ← Paleta personalizada
    ├── postcss.config.js
    └── src/
        ├── main.jsx
        ├── index.css           ← Clases utilitarias: .card, .btn-primary, .chip
        ├── App.jsx             ← Router + gestión de sesión Supabase
        ├── lib/
        │   ├── supabase.js     ← Cliente frontend (anon key)
        │   └── api.js          ← Wrapper fetch que inyecta JWT automáticamente
        ├── pages/
        │   ├── Muro.jsx        ← Lista principal de denuncias (paginada, filtrable)
        │   └── Login.jsx       ← Magic link sin contraseña
        └── components/
            └── ui/
                └── DenunciaCard.jsx  ← Tarjeta con apoyo, estado, gravedad
```

---

## Configuración inicial

### 1. Supabase

1. Crear un proyecto en [supabase.com](https://supabase.com) (gratis).
2. Ir a **Project Settings → API** y anotar:
   - **Project URL** → `SUPABASE_URL` / `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY` (solo para el frontend)
   - **service_role secret key** → `SUPABASE_SERVICE_KEY` (solo para el backend, ⚠️ nunca exponer)
   - **JWT Secret** → `SUPABASE_JWT_SECRET` (en la misma sección)

3. En **Authentication → Settings**, activar:
   - Email provider habilitado
   - "Enable email confirmations" → desactivar para desarrollo (para que el magic link funcione sin confirmar primero)

### 2. Base de datos

En **Supabase → SQL Editor**, ejecutar los archivos en este orden:

```sql
-- Paso 1: estructura completa
-- Copiar y pegar el contenido de database/schema.sql

-- Paso 2 (opcional): datos de prueba
-- Crear primero usuarios desde Supabase → Authentication → Users
-- Copiar sus UUIDs en database/seed.sql y luego ejecutarlo
```

### 3. Backend

```bash
cd backend
cp .env.example .env
# Editar .env con tus claves de Supabase
npm install
npm run dev       # nodemon — recarga automática
```

El servidor corre en `http://localhost:4000`.

### 4. Frontend

```bash
cd frontend
cp .env.example .env
# Editar .env con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm install
npm run dev       # Vite dev server
```

El frontend corre en `http://localhost:5173`. Las peticiones a `/api/*` se redirigen automáticamente al backend en el puerto 4000 (configurado en `vite.config.js`).

---

## Variables de entorno

### `backend/.env`

| Variable | Dónde encontrarla | Descripción |
|---|---|---|
| `PORT` | Libre | Puerto del servidor (default: 4000) |
| `SUPABASE_URL` | Project Settings → API → Project URL | URL del proyecto Supabase |
| `SUPABASE_SERVICE_KEY` | Project Settings → API → service_role | Clave secreta del backend ⚠️ |
| `SUPABASE_JWT_SECRET` | Project Settings → API → JWT Secret | Para verificar tokens del frontend |
| `FRONTEND_URL` | Tu URL de frontend | Para configurar CORS |

> ⚠️ La `service_role` key bypassa Row Level Security. **Nunca** la incluyas en el frontend ni la subas a GitHub. Agregar `backend/.env` al `.gitignore`.

### `frontend/.env`

| Variable | Dónde encontrarla | Descripción |
|---|---|---|
| `VITE_SUPABASE_URL` | Project Settings → API → Project URL | Igual que en backend |
| `VITE_SUPABASE_ANON_KEY` | Project Settings → API → anon public | Clave pública, segura para exponer |

> Las variables `VITE_*` son públicas — Vite las incrusta en el bundle. Usar **solo** la anon key aquí.

---

## Cómo correr el proyecto en local

Necesitas 3 terminales:

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev

# Terminal 3 — Prototipo standalone (opcional, no necesita backend)
npx serve -p 3771 .
# Abrir http://localhost:3771/index.html
```

---

## Roles de usuario

| Rol | Puede hacer |
|---|---|
| **Visitante** | Ver todas las denuncias (sin login) |
| **Ciudadano** | + Crear denuncias, dar apoyo, agregar aportes/confirmaciones |
| **Cuadrilla** | + Cambiar estado de denuncias asignadas, agregar respuestas oficiales |
| **Municipio** | + Acceso total: dashboard, moderar, asignar cuadrillas |

Los roles se asignan manualmente en la tabla `perfiles` de Supabase. El `rol` se verifica en cada endpoint protegido del backend vía `requireRol()`.

Para crear un usuario con rol específico:
1. Crear el usuario desde **Supabase → Authentication → Users → Invite user**
2. Copiar el UUID generado
3. Insertar en SQL Editor:
```sql
INSERT INTO perfiles (id, nombre, rol)
VALUES ('UUID-DEL-USUARIO', 'Nombre Apellido', 'ciudadano');
-- rol puede ser: 'ciudadano', 'cuadrilla', 'municipio'
```

---

## API — Endpoints disponibles

El backend corre en `http://localhost:4000`. Desde el frontend, usar `/api/*` (el proxy de Vite lo redirige).

### Denuncias

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/denuncias` | No | Lista paginada del muro público |
| `GET` | `/denuncias/:id` | No | Detalle de una denuncia |
| `POST` | `/denuncias` | Ciudadano | Crear nueva denuncia |
| `PATCH` | `/denuncias/:id/estado` | Cuadrilla/Municipio | Cambiar estado + respuesta oficial |
| `POST` | `/denuncias/:id/apoyo` | Autenticado | Toggle de apoyo (una vez por usuario) |

**Parámetros de GET /denuncias:**
```
?zona_id=1
?categoria_id=2
?estado=pendiente|en_proceso|resuelto
?orden=reciente|apoyos|gravedad
?pagina=1
```

**Body de POST /denuncias:**
```json
{
  "categoria_id": 1,
  "zona_id": 3,
  "descripcion": "Descripción del problema (20-1000 caracteres)",
  "gravedad": 4,
  "anonima": false
}
```

### Aportes / Confirmaciones

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/denuncias/:id/aportes` | No | Lista de aportes de una denuncia |
| `POST` | `/denuncias/:id/aportes` | Autenticado | Agregar confirmación, evidencia o detalle |

**Body de POST aportes:**
```json
{
  "tipo": "confirmacion",
  "contenido": "Yo también lo vi, está en la esquina de...",
  "anonimo": true
}
```
`tipo` puede ser: `confirmacion`, `evidencia`, `detalle`, `relacionado`

### Dashboard (solo municipio/cuadrilla)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/dashboard` | Municipio/Cuadrilla | Estadísticas: estados, zonas, categorías, tendencia 7 días |

---

## Base de datos — Esquema

### Tablas principales

| Tabla | Descripción |
|---|---|
| `perfiles` | Extiende `auth.users` de Supabase. Tiene el campo `rol`. |
| `categorias` | 9 categorías pre-cargadas (baches, alumbrado, basura, etc.) |
| `zonas` | 10 barrios/zonas de Portoviejo |
| `denuncias` | El núcleo: autor, categoría, zona, descripción, gravedad, estado |
| `fotos_denuncia` | URLs de fotos subidas a Supabase Storage |
| `aportes` | Confirmaciones y comentarios de otros ciudadanos |
| `reacciones` | Apoyos — con UNIQUE (denuncia_id, usuario_id) para evitar duplicados |
| `historial_estados` | Log de cada cambio de estado con respuesta oficial |

### Vista `vista_denuncias`

Vista enriquecida que une todas las tablas y:
- Aplica anonimato: si `anonima = true`, oculta el nombre del autor
- Calcula `dias_sin_resolver` desde la fecha de creación
- Cuenta `total_apoyos`, `total_aportes`, `total_fotos`
- Filtra las denuncias ocultas (`oculta = false`)

Usada por todos los endpoints de lectura pública.

### Trigger `trg_denuncias_updated_at`

Actualiza `updated_at` automáticamente en cada UPDATE a la tabla `denuncias`.

### Anonimato

El sistema garantiza:
- **Anonimato hacia afuera**: si `anonima = true`, la API nunca devuelve el `autor_id` ni el nombre real
- **Responsabilidad hacia adentro**: el `autor_id` siempre se guarda en la base de datos para moderación interna

---

## Diseño y prototipo

El archivo [`index.html`](index.html) en la raíz es un prototipo interactivo **standalone** (sin backend). Muestra:
- Panel izquierdo: mockup de app móvil con feed, detalle de denuncia, votación de sentimiento, comentarios
- Panel derecho: dashboard del municipio con KPIs, gráficas y ranking de zonas

**Para verlo sin instalar nada:**
```bash
npx serve -p 3771 .
# Abrir http://localhost:3771
```

### Paleta de colores (versión reducida)

| Token | Color | Uso |
|---|---|---|
| `brand.yellow` | `#D4A017` | Acciones principales, logo (antes `#FFD400`) |
| `brand.red` | `#B83232` | Alertas, estado pendiente (antes `#E11900`) |
| `brand.green` | `#0E7A45` | Estado resuelto |
| `brand.amber` | `#C87D00` | Estado en proceso |
| `surface.base` | `#F7F6F2` | Fondo general |
| `surface.card` | `#FFFFFF` | Tarjetas |
| `ink.DEFAULT` | `#1A1A1A` | Texto principal |

### Tipografía

- **Anton** — Titulares de denuncias (estilo periódico)
- **Archivo** — Cuerpo de texto
- **Space Mono** — Metadatos, chips, etiquetas técnicas

---

## Lo que falta implementar

### Alta prioridad (para el proyecto)

- [ ] **Página de detalle de denuncia** (`/denuncia/:id`) — ver descripción completa, historial de estados, aportes, fotos
- [ ] **Formulario nueva denuncia** (`/nueva`) — con selector de zona, categoría, gravedad, foto y opción anónima
- [ ] **Panel municipio/cuadrilla** — dashboard con estadísticas, tabla de denuncias asignadas, botón de cambio de estado
- [ ] **Subida de fotos** — conectar `multer` en el backend con Supabase Storage

### Media prioridad

- [ ] **Filtros por zona y categoría** en el muro (los `<select>` en `Muro.jsx` están pendientes)
- [ ] **Página de perfil** — ver mis denuncias, mis aportes
- [ ] **Notificaciones** — email cuando el estado de tu denuncia cambia (Supabase Edge Functions o un cron)
- [ ] **Moderación** — ruta para que municipio marque `oculta = true` en denuncias inapropiadas

### Baja prioridad / Post-entrega

- [ ] **Mapa interactivo** — mostrar denuncias georreferenciadas (Leaflet.js + coordenadas en la tabla)
- [ ] **Ticker en tiempo real** — Supabase Realtime para actualizar el muro sin recargar
- [ ] **PWA** — hacer la app instalable en móviles
- [ ] **.gitignore** adecuado (agregar `node_modules`, `dist`, `.env`)
- [ ] **Deploy** — frontend en Vercel (o servidor propio), backend con `npm start` en tu máquina o servidor

---

## Decisiones de diseño importantes

**¿Por qué magic link y no contraseña?**
El ciudadano promedio no quiere crear otra cuenta. El magic link reduce la fricción al mínimo — solo necesitas un correo para denunciar.

**¿Por qué el backend no usa la anon key?**
La anon key respeta RLS, lo que puede restringir inserciones o lecturas según las políticas. El backend usa la service_role para tener control total y aplica su propia lógica de autorización (roles, validaciones), siendo más predecible y explícito.

**¿Por qué no usar Supabase directamente desde el frontend?**
Hay operaciones que requieren lógica de negocio: generar el titular de la denuncia, registrar en el historial de estados, verificar el rol antes de cambiar un estado. Estas no se pueden expresar solo con RLS — necesitan código en el servidor.

**Anonimato**: el `autor_id` siempre se guarda. Si en el futuro hay un abuso, el municipio puede (con acceso directo a Supabase) identificar quién publicó. El ciudadano ve "Ciudadano Anónimo"; el administrador ve el registro real.

---

## Autor

Proyecto desarrollado para la materia de Programación Web — Universidad Técnica de Manabí.  
Portoviejo, Manabí — 2025.
