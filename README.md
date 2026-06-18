# PortoSinFiltro — El Muro de la Vergüenza

Plataforma web ciudadana para reportar problemas urbanos en Portoviejo, Manabí. Los ciudadanos denuncian, confirman y dan seguimiento a problemas como baches, alumbrado, basura y más. El municipio y cuadrillas gestionan el estado de cada denuncia desde un panel de control.

> Proyecto universitario — Universidad Técnica de Manabí, materia de Programación Web.

---

## Tabla de contenidos

- [Vista general del proyecto](#vista-general-del-proyecto)
- [Prerrequisitos](#prerrequisitos)
- [Quick Start — desde cero](#quick-start--desde-cero)
- [Tecnologías](#tecnologías)
- [Arquitectura](#arquitectura)
- [Estructura de carpetas](#estructura-de-carpetas)
- [Configuración detallada](#configuración-detallada)
  - [1. Supabase](#1-supabase)
  - [2. Base de datos](#2-base-de-datos)
  - [3. Backend](#3-backend)
  - [4. Frontend](#4-frontend)
- [Variables de entorno](#variables-de-entorno)
- [Roles de usuario](#roles-de-usuario)
- [API — Endpoints disponibles](#api--endpoints-disponibles)
- [Base de datos — Esquema](#base-de-datos--esquema)
- [Bugs conocidos y limitaciones actuales](#bugs-conocidos-y-limitaciones-actuales)
- [Lo que falta implementar](#lo-que-falta-implementar)
- [Diseño y prototipo](#diseño-y-prototipo)
- [Decisiones de diseño importantes](#decisiones-de-diseño-importantes)

---

## Vista general del proyecto

| Módulo | Estado |
|---|---|
| Prototipo interactivo (`index.html`) | ✅ Completo |
| Schema de base de datos (Supabase) | ✅ Completo |
| Backend Node.js/Express (API REST) | ✅ Completo |
| Frontend React + Vite + Tailwind | ✅ Completo |
| Autenticación Supabase Auth (magic link) | ✅ Completo |
| Muro (`/`) — lista paginada y filtrable | ✅ Completo |
| Detalle de denuncia (`/denuncia/:id`) | ✅ Completo |
| Formulario nueva denuncia (`/nueva`) | ✅ Completo |
| Panel municipio/cuadrilla (`/panel`) | ✅ Completo |
| Mis denuncias (`/mis-denuncias`) | ✅ Completo (ver bugs conocidos) |
| Página 404 | ✅ Completo |
| Layout compartido sin duplicación | ✅ Completo |
| Constantes centralizadas (`lib/constants.js`) | ✅ Completo |
| Subida de fotos (UI lista, storage pendiente) | 🔧 Parcial |
| Conectar Supabase real (configurar `.env`) | ⏳ Pendiente |
| Deploy en servidor | ⏳ Pendiente |

---

## Prerrequisitos

Antes de empezar, asegúrate de tener instalado:

| Herramienta | Versión mínima | Verificar con |
|---|---|---|
| Node.js | 18.x o superior | `node --version` |
| npm | 9.x o superior | `npm --version` |
| Git | cualquiera reciente | `git --version` |

Cuenta gratuita en [supabase.com](https://supabase.com) (se crea en 2 minutos con GitHub).

---

## Quick Start — desde cero

```bash
# 1. Clonar el repositorio
git clone https://github.com/AxelJhostin/portoSinFiltro.git
cd portoSinFiltro

# 2. Ver el prototipo sin necesitar nada más (opcional)
open index.html        # Mac
# start index.html     # Windows

# 3. Instalar dependencias del backend
cd backend
npm install

# 4. Instalar dependencias del frontend
cd ../frontend
npm install
```

Después de instalar, necesitas configurar Supabase (ver sección siguiente) y los archivos `.env` antes de correr el proyecto.

---

## Tecnologías

### Frontend
- **React 18** — UI declarativa con hooks
- **Vite** — bundler rápido para desarrollo y build
- **Tailwind CSS 3** — utilidades de estilo con paleta personalizada en `tailwind.config.js`
- **React Router v6** — navegación SPA (client-side routing)
- **Supabase JS** — cliente para Auth (magic link) desde el navegador

### Backend
- **Node.js + Express 4** — API REST (`"type": "module"` — usa ES imports)
- **Supabase JS** (service role) — acceso a la BD con permisos de administrador
- **jsonwebtoken** — verificación de tokens JWT emitidos por Supabase Auth
- **express-validator** — validación de entradas en cada ruta
- **multer** — preparado para subida de fotos (pendiente de conectar)
- **dotenv** — variables de entorno

### Base de datos
- **PostgreSQL en Supabase** — tablas, vistas, triggers y RLS
- **Row Level Security (RLS)** — segunda capa de seguridad; el backend usa `service_role` que la bypassa, pero protege accesos directos a la BD

---

## Arquitectura

```
Navegador (React)
    │
    │── Supabase Auth (magic link) ──► Supabase Auth Service
    │
    │── fetch /api/* ─────────────────► Express API (puerto 4000)
    │                                         │
    │                                   JWT verify (middleware/auth.js)
    │                                         │
    │                                   Supabase service_role client
    │                                         │
    └─────────────────────────────── PostgreSQL (Supabase)
                                           │
                                      RLS (segunda capa)
```

**Regla clave:** el frontend **nunca** escribe directamente en la base de datos. Toda mutación pasa por el backend, que verifica el JWT y el rol antes de actuar.

---

## Estructura de carpetas

```
portoSinFiltro/
├── index.html                   ← Prototipo standalone (funciona sin backend ni BD)
├── .gitignore                   ← Excluye node_modules/, dist/, .env, package-lock.json
├── project/                     ← Archivos originales del diseño (Claude Design)
│   ├── PortoSinFiltro.dc.html   ← Prototipo dc-runtime original
│   └── PortoSinFiltro-print.dc.html
│
├── database/
│   ├── schema.sql               ← Schema completo: tablas, trigger, vista, RLS
│   └── seed.sql                 ← Datos de prueba (leer comentarios del archivo)
│
├── backend/
│   ├── .env.example             ← Plantilla de variables (copiar a .env y rellenar)
│   ├── package.json             ← "type": "module" — necesario para ES imports
│   └── src/
│       ├── index.js             ← Servidor Express: CORS, rutas, error handler global
│       ├── db/
│       │   └── supabase.js      ← Cliente Supabase con service_role (bypassa RLS)
│       ├── middleware/
│       │   └── auth.js          ← requireAuth() verifica JWT · requireRol() verifica rol
│       └── routes/
│           ├── denuncias.js     ← GET lista, GET detalle, POST crear, PATCH estado, POST apoyo
│           ├── aportes.js       ← GET aportes de denuncia, POST nuevo aporte
│           └── dashboard.js     ← Estadísticas para municipio/cuadrilla
│
└── frontend/
    ├── .env.example             ← Plantilla de variables (copiar a .env y rellenar)
    ├── index.html               ← HTML base de Vite
    ├── package.json             ← "type": "module", React 18, Vite, Tailwind
    ├── vite.config.js           ← Proxy: /api/* → http://localhost:4000
    ├── tailwind.config.js       ← Paleta personalizada: brand.*, surface.*, ink.*
    ├── postcss.config.js
    └── src/
        ├── main.jsx             ← Punto de entrada React
        ├── index.css            ← Directivas Tailwind + clases utilitarias: .card, .btn-primary, .chip, .estado-*
        ├── App.jsx              ← BrowserRouter + carga de sesión Supabase + carga de perfil (rol)
        ├── lib/
        │   ├── supabase.js      ← Cliente frontend (anon key — segura para exponer)
        │   ├── api.js           ← fetch wrapper: inyecta JWT automáticamente en cada petición
        │   └── constants.js     ← Fuente única: CATEGORIAS, ZONAS, ESTADO_*, GRAVEDAD_LABEL, TIPO_APORTE_LABEL
        ├── pages/
        │   ├── Muro.jsx         ← Lista paginada + filtros zona / categoría / orden
        │   ├── DetalleDenuncia.jsx  ← Detalle completo + lista de aportes + formulario de aporte
        │   ├── NuevaDenuncia.jsx    ← Formulario: categoría, zona, descripción, gravedad, foto, anónimo
        │   ├── Panel.jsx        ← Dashboard municipio/cuadrilla: KPIs, ranking zonas, cambio de estado
        │   ├── MisDenuncias.jsx ← Denuncias del usuario logueado (ver bugs conocidos)
        │   ├── Login.jsx        ← Autenticación con magic link (sin contraseña)
        │   └── NotFound.jsx     ← Página 404
        └── components/
            ├── layout/
            │   └── Layout.jsx   ← Header + footer compartido · prop `back` muestra "← Volver" y oculta ticker
            └── ui/
                └── DenunciaCard.jsx  ← Tarjeta: titular, chip de estado, apoyo toggle, barra de gravedad
```

---

## Configuración detallada

### 1. Supabase

1. Crear un proyecto en [supabase.com](https://supabase.com) — es gratis, tarda ~2 minutos.

2. Ir a **Project Settings → API** y copiar estos 4 valores:

   | Valor en Supabase | Variable que necesita |
   |---|---|
   | Project URL | `SUPABASE_URL` (backend) y `VITE_SUPABASE_URL` (frontend) |
   | `anon` `public` key | `VITE_SUPABASE_ANON_KEY` (solo frontend) |
   | `service_role` `secret` key | `SUPABASE_SERVICE_KEY` (solo backend) ⚠️ |
   | JWT Secret (en la misma página) | `SUPABASE_JWT_SECRET` (solo backend) |

3. Ir a **Authentication → Settings**:
   - Confirmar que el proveedor **Email** está habilitado
   - Desactivar **"Confirm email"** mientras desarrollas (así el magic link no requiere confirmar primero)

### 2. Base de datos

En **Supabase → SQL Editor**, ejecutar en este orden:

**Paso 1 — Schema** (obligatorio):
Copiar y pegar todo el contenido de `database/schema.sql` y ejecutar.
Crea las 8 tablas, el trigger de `updated_at`, la vista `vista_denuncias` y las políticas RLS.

**Paso 2 — Seed** (opcional, para datos de prueba):
1. Ir a **Supabase → Authentication → Users → Add user**
2. Crear los usuarios de prueba (ciudadano, cuadrilla, municipio)
3. Copiar el UUID de cada usuario (aparece en la lista de usuarios)
4. Pegar los UUIDs en `database/seed.sql` donde dice `UUID-DEL-...`
5. Ejecutar el seed en el SQL Editor

### 3. Backend

```bash
cd backend

# Copiar la plantilla y rellenar con tus claves de Supabase
cp .env.example .env
# Editar backend/.env — ver sección Variables de entorno

npm install
npm run dev      # Arranca con nodemon (recarga automática al guardar)
# o: npm start   # Producción (sin recarga automática)
```

El backend queda corriendo en `http://localhost:4000`.

### 4. Frontend

```bash
cd frontend

# Copiar la plantilla y rellenar
cp .env.example .env
# Editar frontend/.env — solo necesita VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY

npm install
npm run dev      # Vite dev server con hot-reload
```

El frontend queda en `http://localhost:5173`.
Las peticiones a `/api/*` se redirigen automáticamente al backend gracias al proxy en `vite.config.js` — no es necesario cambiar nada más.

### Correr todo junto

Necesitas **dos terminales abiertas** simultáneamente:

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Abrir el navegador en `http://localhost:5173`.

---

## Variables de entorno

### `backend/.env`

```env
PORT=4000
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...   # service_role key
SUPABASE_JWT_SECRET=tu-jwt-secret-de-supabase
FRONTEND_URL=http://localhost:5173
```

| Variable | Dónde encontrarla | Descripción |
|---|---|---|
| `PORT` | Libre | Puerto del servidor (default: 4000) |
| `SUPABASE_URL` | Project Settings → API → Project URL | URL del proyecto |
| `SUPABASE_SERVICE_KEY` | Project Settings → API → service_role secret | ⚠️ NUNCA exponer al frontend |
| `SUPABASE_JWT_SECRET` | Project Settings → API → JWT Secret | Para verificar tokens del frontend |
| `FRONTEND_URL` | La URL donde corre el frontend | Configura CORS |

> ⚠️ La `service_role` key bypassa Row Level Security — tiene acceso total a la BD. **Nunca** la pongas en el frontend ni la subas a GitHub. El archivo `.env` ya está en `.gitignore`.

### `frontend/.env`

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...   # anon key
```

| Variable | Dónde encontrarla | Descripción |
|---|---|---|
| `VITE_SUPABASE_URL` | Project Settings → API → Project URL | Igual que en backend |
| `VITE_SUPABASE_ANON_KEY` | Project Settings → API → anon public | Clave pública, segura para exponer |

> Las variables con prefijo `VITE_` son públicas — Vite las incrusta en el bundle de producción. Usar **solo** la anon key aquí, nunca la service_role.

---

## Roles de usuario

| Rol | Acceso |
|---|---|
| **Visitante** | Ver todas las denuncias sin login |
| **Ciudadano** | + Crear denuncias, dar apoyo, agregar aportes, ver sus denuncias |
| **Cuadrilla** | + Cambiar estado de denuncias, agregar respuestas oficiales, ver panel |
| **Municipio** | + Todo lo anterior + acceso al dashboard completo |

**Cómo asignar un rol a un usuario:**

1. Crear el usuario desde **Supabase → Authentication → Users → Add user**
2. Ir a la lista de usuarios, hacer clic en el usuario y copiar su **UUID** (aparece como "User UID")
3. Ir a **SQL Editor** y ejecutar:

```sql
INSERT INTO perfiles (id, nombre, rol)
VALUES ('PEGAR-UUID-AQUI', 'Nombre Apellido', 'ciudadano');

-- Valores válidos para rol: 'ciudadano', 'cuadrilla', 'municipio'
```

El rol se verifica en cada request al backend mediante el middleware `requireRol()` en `backend/src/middleware/auth.js`.

---

## API — Endpoints disponibles

El backend corre en `http://localhost:4000`. Desde el frontend siempre usar `/api/*` (el proxy de Vite lo redirige al backend automáticamente).

### Denuncias

| Método | Ruta | Auth requerida | Descripción |
|---|---|---|---|
| `GET` | `/denuncias` | No | Lista paginada, pública |
| `GET` | `/denuncias/:id` | No | Detalle de una denuncia |
| `POST` | `/denuncias` | ciudadano | Crear nueva denuncia |
| `PATCH` | `/denuncias/:id/estado` | cuadrilla o municipio | Cambiar estado + respuesta oficial |
| `POST` | `/denuncias/:id/apoyo` | cualquier usuario logueado | Toggle de apoyo (1 por usuario) |

**Parámetros opcionales de `GET /denuncias`:**
```
?zona_id=1             — filtrar por zona (ID numérico)
?categoria_id=2        — filtrar por categoría (ID numérico)
?estado=pendiente      — pendiente | en_proceso | resuelto
?orden=reciente        — reciente | apoyos | gravedad
?pagina=1              — paginación (20 resultados por página)
```

**Body de `POST /denuncias`:**
```json
{
  "categoria_id": 1,
  "zona_id": 3,
  "descripcion": "Descripción del problema (mínimo 20, máximo 1000 caracteres)",
  "gravedad": 4,
  "anonima": false
}
```

### Aportes / Confirmaciones

| Método | Ruta | Auth requerida | Descripción |
|---|---|---|---|
| `GET` | `/denuncias/:id/aportes` | No | Lista de aportes de una denuncia |
| `POST` | `/denuncias/:id/aportes` | cualquier usuario logueado | Agregar aporte |

**Body de `POST /denuncias/:id/aportes`:**
```json
{
  "tipo": "confirmacion",
  "contenido": "Texto descriptivo del aporte",
  "anonimo": false
}
```
Valores válidos para `tipo`: `confirmacion`, `evidencia`, `detalle`, `relacionado`

### Dashboard

| Método | Ruta | Auth requerida | Descripción |
|---|---|---|---|
| `GET` | `/dashboard` | municipio o cuadrilla | KPIs, top zonas, top categorías, tendencia 7 días |

---

## Base de datos — Esquema

### Tablas

| Tabla | Descripción |
|---|---|
| `perfiles` | Extiende `auth.users` de Supabase. Contiene `nombre` y `rol`. |
| `categorias` | 9 categorías pre-cargadas por el schema (baches, alumbrado, basura…) |
| `zonas` | 10 barrios/zonas de Portoviejo, pre-cargadas por el schema |
| `denuncias` | Núcleo del sistema: autor, categoría, zona, descripción, gravedad, estado |
| `fotos_denuncia` | URLs de fotos subidas a Supabase Storage |
| `aportes` | Confirmaciones y comentarios de ciudadanos sobre una denuncia |
| `reacciones` | Apoyos — `UNIQUE(denuncia_id, usuario_id)` garantiza 1 apoyo por usuario |
| `historial_estados` | Log inmutable de cada cambio de estado con respuesta oficial |

### Vista `vista_denuncias`

Usada por todos los endpoints de lectura pública. Une las tablas y:
- Aplica anonimato: si `anonima = true`, devuelve `NULL` para `autor_id` y `'Ciudadano Anónimo'` para `autor_nombre`
- Calcula `dias_sin_resolver` (días desde `created_at`)
- Cuenta `total_apoyos`, `total_aportes`, `total_fotos`
- Excluye denuncias con `oculta = true`

### Trigger `trg_denuncias_updated_at`

Se dispara en cada `UPDATE` de la tabla `denuncias` y actualiza automáticamente el campo `updated_at`.

### Anonimato

- **Hacia afuera**: si `anonima = true`, la API nunca retorna el `autor_id` ni el nombre real
- **Hacia adentro**: el `autor_id` siempre se almacena en la BD para moderación interna del municipio

---

## Bugs conocidos y limitaciones actuales

### `MisDenuncias` muestra todas las denuncias, no solo las del usuario

**Archivo:** `frontend/src/pages/MisDenuncias.jsx`

**Problema:** La página llama a `api.denuncias.list()` sin filtrar por `autor_id`, por lo que muestra todas las denuncias públicas en lugar de solo las del usuario logueado.

**Causa:** El backend no tiene aún un endpoint `/mis-denuncias` ni acepta un parámetro `autor_id` en `GET /denuncias`.

**Para corregirlo se necesita:**
1. En `backend/src/routes/denuncias.js` → agregar soporte para `?autor_id=UUID` en el query de `GET /denuncias`, **solo** cuando el JWT del request coincide con ese UUID (para no exponer denuncias de otros).
2. En `frontend/src/pages/MisDenuncias.jsx` → pasar el ID del usuario: `api.denuncias.list({ autor_id: session.user.id })`.

### Subida de fotos — solo UI

El selector de foto en `NuevaDenuncia.jsx` guarda el archivo en estado local pero no lo envía al backend. La lógica de subida a Supabase Storage y el endpoint en el backend están pendientes.

---

## Lo que falta implementar

### Para conectar y entregar

- [ ] **Configurar Supabase** — crear proyecto, ejecutar `schema.sql`, copiar claves a `.env`
- [ ] **Corregir filtro de Mis Denuncias** — ver sección "Bugs conocidos" para los pasos exactos
- [ ] **Subida de fotos** — conectar el selector (ya en UI) con `multer` en el backend y Supabase Storage

### Media prioridad

- [ ] **Historial de estados en el detalle** — mostrar el log de `historial_estados` en `/denuncia/:id`
- [ ] **Moderación** — botón en el panel para marcar `oculta = true` en denuncias inapropiadas
- [ ] **Notificaciones por email** — avisar al ciudadano cuando cambia el estado de su denuncia (Supabase Edge Functions)

### Post-entrega

- [ ] **Mapa interactivo** — denuncias georreferenciadas con Leaflet.js
- [ ] **Tiempo real** — Supabase Realtime para actualizar el muro sin recargar
- [ ] **PWA** — app instalable en móviles
- [ ] **Deploy** — frontend en Vercel (gratis), backend en el servidor de la universidad

---

## Diseño y prototipo

El archivo `index.html` en la raíz es un prototipo interactivo **standalone** — funciona abriendo el archivo directamente en el navegador, sin instalar nada ni conectar un backend.

Incluye:
- Panel izquierdo: mockup de app móvil con feed de denuncias, vista de detalle, votación de sentimiento, comentarios anónimos
- Panel derecho: dashboard del municipio con KPIs, gráficas de categorías, ranking de zonas y evolución temporal

```bash
# Opción 1 — abrir directo (Mac)
open index.html

# Opción 2 — servir con un servidor local
npx serve -p 3771 .
# luego abrir http://localhost:3771
```

### Paleta de colores

El diseño original fue calificado como "chevere pero demasiado saturado". La paleta fue reducida:

| Token Tailwind | Color | Uso | Original |
|---|---|---|---|
| `brand.yellow` | `#D4A017` | Acciones principales, logo | `#FFD400` |
| `brand.red` | `#B83232` | Alertas, estado pendiente | `#E11900` |
| `brand.green` | `#0E7A45` | Estado resuelto | igual |
| `brand.amber` | `#C87D00` | Estado en proceso | `#E8A300` |
| `surface.base` | `#F7F6F2` | Fondo general | `#dcdbd5` |
| `surface.card` | `#FFFFFF` | Tarjetas | — |
| `ink.DEFAULT` | `#1A1A1A` | Texto principal | `#0a0a0a` |

### Tipografía

- **Anton** — Titulares de denuncias (estilo periódico/editorial)
- **Archivo** — Cuerpo de texto
- **Space Mono** — Metadatos, chips, etiquetas técnicas

---

## Decisiones de diseño importantes

**¿Por qué magic link y no contraseña?**
El ciudadano promedio no quiere crear otra cuenta. El magic link reduce la fricción al mínimo — solo se necesita un correo para denunciar.

**¿Por qué el backend usa `service_role` y no la anon key?**
La anon key respeta RLS, lo que puede bloquear inserciones o lecturas según las políticas definidas. El backend con `service_role` tiene control total y aplica su propia lógica de autorización (verificación de JWT + rol), siendo más predecible y explícito que RLS solo.

**¿Por qué no usar Supabase directamente desde el frontend para todo?**
Hay operaciones que requieren lógica de negocio que no se puede expresar en RLS: generar el titular de la denuncia, registrar en el historial de estados, verificar el rol antes de cambiar un estado. Esas cosas necesitan código en el servidor.

**¿Por qué centralizar las constantes en `lib/constants.js`?**
Las listas de categorías, zonas y estados se usaban en 5-6 archivos distintos. Si hay que agregar una zona nueva o cambiar un label, se edita un solo archivo y se propaga a toda la app.

**Anonimato con responsabilidad**: el `autor_id` siempre se guarda en la BD. El ciudadano ve "Ciudadano Anónimo" en el muro; el municipio con acceso directo a Supabase puede identificar al autor si hay un abuso.

---

## Autor

Desarrollado por Axel Hernández — Universidad Técnica de Manabí, Portoviejo, Manabí — 2025.
