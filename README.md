# PortoSinFiltro — El Muro de la Vergüenza

Plataforma web ciudadana para reportar problemas urbanos en Portoviejo, Manabí. Los ciudadanos denuncian, confirman y dan seguimiento a problemas como baches, alumbrado, basura y más. El **estado** de cada denuncia lo refleja la **comunidad**; los **administradores** solo moderan (ocultar/restaurar).

> Proyecto universitario — PUCE Sede Manabí, Portoviejo, materia de Sistemas de Información.

---

## 🚀 Setup rápido para el equipo (handoff)

> **Esta sección está pensada para copiarse y pegarse a una IA (ChatGPT, Claude, Cursor, etc.).**
> Contiene TODO lo necesario para dejar el proyecto corriendo **en local** para pruebas/presentación.
> Modo de ejecución elegido: **app local (frontend + backend en tu máquina) usando Supabase Cloud** para Auth + base de datos. No se usa Docker ni Supabase local.

### Reparto de responsabilidades

| Responsable | Tarea |
|---|---|
| **Encargado de Supabase** | Crear el schema, arreglar la vista, añadir la policy, crear usuarios de prueba, y compartir las claves del backend |
| **Resto del equipo** | Configurar `.env` con las claves recibidas, instalar dependencias y correr el proyecto en local |

### Datos del proyecto Supabase (académico)

```text
URL:               https://xynkalcsaubgseoiiavz.supabase.co
Publishable key:   sb_publishable_Lx9D4wQVbgrvxP5eUpuz4w_2ptjXJxq   (frontend, pública)
Secret key:        sb_secret_********  (solo backend — NO se publica; pedirla por canal privado)
Conexión Postgres: postgresql://postgres:[DB-PASSWORD]@db.xynkalcsaubgseoiiavz.supabase.co:5432/postgres
```

> ⚠️ La **secret key** solo va en el backend, NUNCA en el frontend.
>
> 🔐 **Autenticación (importante):** el login es **email + contraseña** (`signInWithPassword`). Este proyecto usa **JWT asimétrico (ES256)**: el backend verifica los tokens contra el **JWKS** de Supabase (`/auth/v1/.well-known/jwks.json`) de forma automática. Por eso **NO se necesita** `SUPABASE_JWT_SECRET`. El backend solo requiere `SUPABASE_URL` y `SUPABASE_SERVICE_KEY` para arrancar (se validan en `backend/src/index.js`).

### Paso A — Tareas del encargado de Supabase

**A1.** En **Supabase → SQL Editor**, ejecutar todo el contenido de `database/schema.sql`.
Esto ya crea las tablas, la vista `vista_denuncias`, la policy `usuarios_ven_su_perfil`, el trigger `handle_new_user` y el bucket de fotos.

> Si corriste una versión **anterior** del `schema.sql` (sin estos arreglos), vuelve a ejecutar solo la parte de la vista, la policy `usuarios_ven_su_perfil` y el bloque `handle_new_user` que están al final del archivo actual.
>
> 🗺️📷 **Para ubicación (mapa) y fotos:** ejecuta `database/migracion_ubicacion_fotos.sql` — agrega `latitud`/`longitud`, actualiza la vista y crea el bucket `denuncias`.
>
> 🖼️ **Para miniaturas en el muro:** ejecuta `database/migracion_foto_portada.sql` — agrega `foto_portada` a la vista.
>
> 📊 **Para valoraciones de progreso:** ejecuta `database/migracion_progreso_ciudadano.sql` — tabla `valoraciones_progreso` y conteos en la vista. (Si recreas todo desde `schema.sql` actual, ya viene incluido.)
>
> 👥 **Para roles comunitarios:** ejecuta `database/migracion_roles_comunitarios.sql` — roles `ciudadano`/`administrador`, reportes de denuncias falsas, estado comunitario en la vista y tipo de aporte `resolucion`. Ver `docs/PLAN-ROLES-COMUNITARIOS.md`.
>
> ✅ **Para resolución única:** ejecuta `database/migracion_resolucion_unica.sql` — cada ciudadano solo puede confirmar resolución **una vez** por denuncia (se necesitan **3 ciudadanos distintos** para RESUELTA).
>
> ⚠️ **Orden importante en la migración de roles:** primero se elimina el CHECK viejo de `perfiles.rol`, luego se hace el `UPDATE` a `administrador`, y al final se crea el CHECK nuevo. Si el script falla con error `23514`, usa la versión actual del archivo en el repo (commit `0219dbc` o posterior).

**A2.** En **Authentication → URL Configuration**:

```text
Site URL:       http://localhost:5173
Redirect URLs:  http://localhost:5173
                http://localhost:5173/*
```

En **Authentication → Providers → Email**: activar Email.

> 📝 **Para el registro en vivo (signUp):** en **Authentication → Providers → Email**, desactiva **"Confirm email"**. Así, cuando un ciudadano se registra desde la página, entra al instante sin tener que confirmar un correo. (El login es email + contraseña; no se envían correos.)

**A3.** Crear usuarios de prueba en **Authentication → Users → Add user** (email, contraseña, marcar **"Auto Confirm User"**):

```text
adolfo@demo.com   — ciudadano (también puede registrarse desde /login)
axel@demo.com     — administrador
elkin@demo.com    — administrador
marcelo@demo.com  — administrador
```

Copiar el UUID de cada admin y crear su perfil en SQL Editor:

```sql
INSERT INTO perfiles (id, nombre, rol) VALUES
  ('UUID_AQUI', 'Axel',    'administrador'),
  ('UUID_AQUI', 'Elkin',   'administrador'),
  ('UUID_AQUI', 'Marcelo', 'administrador');
-- Valores válidos para rol: 'ciudadano', 'administrador'
```

> Si ya tenías usuarios con rol `municipio` o `cuadrilla`, la migración `migracion_roles_comunitarios.sql` los convierte automáticamente a `administrador`.
>
> Los **ciudadanos** pueden registrarse desde `/login` → "Regístrate" (trigger `handle_new_user` asigna rol `ciudadano`). El rol `administrador` solo se asigna manualmente en Supabase.

**Verificar roles** (después de la migración):

```sql
SELECT nombre, rol FROM perfiles ORDER BY rol, nombre;
```

Estado esperado en el proyecto académico:

| nombre | rol |
|---|---|
| Adolfo | ciudadano |
| Axel, Elkin, Marcelo | administrador |

**A4.** Compartir con el equipo solo la **secret key** (por canal privado, NO subir a Git). Está en **Project Settings → API Keys → secret**. No hace falta compartir ningún JWT secret (se usa JWKS).

### Paso B — Tareas del resto del equipo (configurar y correr)

Los archivos `.env` ya están creados en el repo local con las credenciales del proyecto. No deberías necesitar tocarlos, pero estos son los valores correctos:

**`frontend/.env`**:

```env
VITE_SUPABASE_URL=https://xynkalcsaubgseoiiavz.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_Lx9D4wQVbgrvxP5eUpuz4w_2ptjXJxq
```

> El frontend lee la variable `VITE_SUPABASE_ANON_KEY` (ver `frontend/src/lib/supabase.js`). El **valor** es la publishable key; el nombre de la variable debe mantenerse así.

**`backend/.env`**:

```env
PORT=4000
SUPABASE_URL=https://xynkalcsaubgseoiiavz.supabase.co
SUPABASE_SERVICE_KEY=sb_secret_********   # pedir por canal privado, NO publicar
FRONTEND_URL=http://localhost:5173
```

> 🔑 La **secret key real** no se versiona. Está en tu `backend/.env` local (que está en `.gitignore`). Si un compañero la necesita, compártela por un canal privado, nunca en el repo.

Instalar y correr (en **dos terminales**):

```bash
# Terminal 1
cd backend && npm install && npm run dev      # → http://localhost:4000

# Terminal 2
cd frontend && npm install && npm run dev     # → http://localhost:5173
```

Abrir `http://localhost:5173`.

### Paso C — Checklist de prueba (flujo de presentación)

```text
[ ] 1.  Abrir el muro (/) — filtrar por ACTIVA / CON AVANCE / RESUELTA / Todas
[ ] 2.  Entrar como Adolfo (ciudadano) o registrarse en /login
[ ] 3.  Crear denuncia en /nueva (mapa + foto JPG/PNG, no HEIC)
[ ] 4.  La denuncia aparece en el muro con miniatura si tiene foto
[ ] 5.  Abrir el detalle — foto, mapa, barra de gravedad tipo pila
[ ] 6.  Dar apoyo (persiste al recargar) y marcar si progresa (Sí / No)
[ ] 7.  Ver indicador «cuánto falta» bajo el chip de estado; el chip se actualiza sin recargar la página
[ ] 8.  Otro ciudadano reporta la denuncia como falsa (motivo ≥ 10 caracteres)
[ ] 9.  Ver /mis-denuncias (incluye anónimas propias)
[ ] 10. Abrir /panel-publico — estadísticas y filtros ACTIVA / CON AVANCE / RESUELTA
[ ] 11. Entrar como Axel (administrador) → /admin — ver reportes y ocultar denuncia
[ ] 12. Verificar que la denuncia oculta desaparece del muro; restaurar desde /admin
[ ] 13. Tres ciudadanos distintos confirman resolución → estado RESUELTA en el muro (1 resolución por persona)
```

### Paso D — Estados comunitarios (IMPORTANTE)

> **El administrador NO puede marcar “Con avance” ni “Resuelta” a mano.** Esos contadores en `/admin` reflejan lo que hace la comunidad. El admin solo **oculta o restaura** denuncias.

| Estado en UI | Quién lo provoca | Condición exacta |
|---|---|---|
| **ACTIVA** | — | Default. No hay suficientes señales comunitarias. |
| **CON AVANCE** | Ciudadanos | ≥ **2** votos **“Sí progresa”** y más sí que no (`total_progreso_si > total_progreso_no`). |
| **RESUELTA** | Ciudadanos | ≥ **3** aportes tipo **`resolucion`** de **3 ciudadanos distintos** (máx. 1 por persona). |

**Prioridad:** si hay ≥3 resoluciones, la denuncia es **RESUELTA** aunque no haya votos de progreso.

#### Cómo pasar a CON AVANCE (paso a paso)

1. Entrar como **ciudadano** (ej. Adolfo) → abrir `/denuncia/:id`.
2. En **“¿Está progresando?”** → pulsar **“✓ Sí progresa”**.
3. Repetir con **otro ciudadano distinto** (registrar segunda cuenta en `/login` si hace falta).
4. Recargar muro o `/admin` → el chip pasa a **CON AVANCE** y el KPI sube.

| Votos sí | Votos no | Resultado |
|---|---|---|
| 2 | 0 | ✅ CON AVANCE |
| 2 | 1 | ✅ CON AVANCE |
| 2 | 2 | ❌ sigue ACTIVA (no hay mayoría de sí) |
| 1 | 0 | ❌ sigue ACTIVA (falta 1 voto más) |

> Cada ciudadano tiene **1 voto** por denuncia (`valoraciones_progreso`). Pulsar otra vez el mismo botón **quita** el voto.

#### Cómo pasar a RESUELTA (paso a paso)

1. Entrar como ciudadano → abrir `/denuncia/:id`.
2. En **“¿Conoces este problema?”** → tipo **“Confirmo que ya se resolvió”**.
3. Escribir descripción (mín. 5 caracteres en la UI) → **Enviar aporte**.
4. Repetir con **2 ciudadanos más** (cuentas distintas; cada uno solo puede confirmar **una vez**).
5. El chip pasa a **RESUELTA** sin recargar la página; KPI **Resueltas** sube en `/admin` y `/panel-publico`.

#### Qué NO cambia el estado

| Acción | ¿Cambia estado? |
|---|---|
| Apoyar denuncia | No |
| Reportar como falsa | No (solo alerta al admin) |
| Admin oculta denuncia | No (desaparece del muro, pero el estado calculado sigue igual) |
| Aportes confirmación / evidencia / detalle | No (solo `resolucion` cuenta para RESUELTA) |

Ver también: [Estados comunitarios — guía completa](#estados-comunitarios--guía-completa).

### Plan B (si Supabase falla en la presentación)

El archivo `index.html` de la raíz es un **prototipo standalone** que funciona sin backend ni base de datos:

```bash
open index.html            # Mac
# o servirlo:
npx serve -p 3771 .        # luego abrir http://localhost:3771
```

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
- [Estados comunitarios — guía completa](#estados-comunitarios--guía-completa)
- [API — Endpoints disponibles](#api--endpoints-disponibles)
- [Base de datos — Esquema](#base-de-datos--esquema)
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
| Autenticación Supabase Auth (email + contraseña) | ✅ Completo |
| Registro de ciudadanos desde la página (signUp + trigger) | ✅ Completo |
| Muro (`/`) — lista vertical, tarjetas con foto y barra de gravedad | ✅ Completo |
| Detalle de denuncia (`/denuncia/:id`) | ✅ Completo |
| Formulario nueva denuncia (`/nueva`) — solo rol ciudadano | ✅ Completo |
| Roles comunitarios + moderación admin (`/admin`) | ✅ Completo |
| Reportes de denuncias falsas + estado comunitario | ✅ Completo |
| Migración Supabase (`migracion_roles_comunitarios.sql`) | ✅ Aplicada |
| Panel público (`/panel-publico`) — estadísticas solo lectura | ✅ Completo |
| Mis denuncias (`/mis-denuncias`) | ✅ Completo |
| Valoración de progreso por ciudadanos (Sí / No progresa) | ✅ Completo |
| Página 404 | ✅ Completo |
| Layout compartido sin duplicación | ✅ Completo |
| Constantes centralizadas (`lib/constants.js`) | ✅ Completo |
| Subida de fotos a Supabase Storage | ✅ Completo |
| Ubicación en mapa interactivo (Leaflet) | ✅ Completo |
| Conectar Supabase real (configurar `.env`) | ✅ Completo |
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
- **Supabase JS** — cliente para Auth (email + contraseña) desde el navegador

### Backend
- **Node.js + Express 4** — API REST (`"type": "module"` — usa ES imports)
- **Supabase JS** (service role / secret key) — acceso a la BD con permisos de administrador
- **jose** — verificación de tokens JWT (ES256) de Supabase Auth contra el JWKS
- **express-validator** — validación de entradas en cada ruta
- **multer** — recibe la foto y la sube a Supabase Storage (bucket `denuncias`)
- **dotenv** — variables de entorno

### Base de datos
- **PostgreSQL en Supabase** — tablas, vistas, triggers y RLS
- **Row Level Security (RLS)** — segunda capa de seguridad; el backend usa `service_role` que la bypassa, pero protege accesos directos a la BD

---

## Arquitectura

```
Navegador (React)
    │
    │── Supabase Auth (email + contraseña) ─► Supabase Auth Service
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
│   ├── schema.sql                      ← Schema completo: tablas, trigger, vista, RLS
│   ├── seed.sql                        ← Datos de prueba (leer comentarios del archivo)
│   ├── migracion_ubicacion_fotos.sql   ← Mapa + Storage (BD existente)
│   ├── migracion_foto_portada.sql      ← Miniatura en listados (BD existente)
│   ├── migracion_progreso_ciudadano.sql ← Valoraciones Sí/No progresa (BD existente)
│   ├── migracion_roles_comunitarios.sql ← Roles ciudadano/admin, reportes, estado comunitario
│   └── migracion_resolucion_unica.sql   ← 1 resolución por ciudadano por denuncia
│
├── docs/
│   └── PLAN-ROLES-COMUNITARIOS.md      ← Plan y decisiones del modelo comunitario
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
│           ├── denuncias.js     ← CRUD, apoyo, progreso, reportes, ocultar, fotos
│           ├── aportes.js       ← GET/POST aportes (incl. resolucion)
│           ├── admin.js         ← Cola moderación: denuncias + reportes
│           └── dashboard.js     ← Stats gestión + /dashboard/public
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
        │   ├── Muro.jsx              ← Feed vertical, filtros, DenunciaCard
        │   ├── DetalleDenuncia.jsx   ← Detalle + apoyo + progreso + aportes
        │   ├── NuevaDenuncia.jsx     ← Crear denuncia (solo ciudadano)
        │   ├── Admin.jsx               ← Moderación administrador
        │   ├── PanelPublico.jsx      ← Estadísticas públicas (solo lectura)
        │   ├── MisDenuncias.jsx      ← Denuncias del usuario logueado
        │   ├── Login.jsx             ← Login + registro ciudadano
        │   └── NotFound.jsx
        └── components/
            ├── layout/
            │   └── Layout.jsx        ← Header, ticker, Salir → muro
            └── ui/
                ├── DenunciaCard.jsx  ← Tarjeta horizontal (foto + info + apoyo)
                ├── BarraGravedad.jsx ← Indicador tipo pila (verde → rojo)
                └── MapaUbicacion.jsx ← Mapa Leaflet
```

---

## Configuración detallada

### 1. Supabase

1. Crear un proyecto en [supabase.com](https://supabase.com) — es gratis, tarda ~2 minutos.

2. Ir a **Project Settings → API** y copiar estos 3 valores:

   | Valor en Supabase | Variable que necesita |
   |---|---|
   | Project URL | `SUPABASE_URL` (backend) y `VITE_SUPABASE_URL` (frontend) |
   | publishable / `anon` key | `VITE_SUPABASE_ANON_KEY` (solo frontend) |
   | secret / `service_role` key | `SUPABASE_SERVICE_KEY` (solo backend) ⚠️ |

   > No se necesita ningún JWT secret: el backend verifica los tokens (ES256) contra el JWKS de Supabase automáticamente.

3. Ir a **Authentication → Settings**:
   - Confirmar que el proveedor **Email** está habilitado
   - El login es por **email + contraseña**; al crear usuarios marca **"Auto Confirm User"** para que entren sin verificar correo

### 2. Base de datos

En **Supabase → SQL Editor**, ejecutar en este orden:

**Paso 1 — Schema** (obligatorio en proyecto nuevo):
Copiar y pegar todo el contenido de `database/schema.sql` y ejecutar.

**Paso 1b — Migraciones** (si la BD ya existía antes de una feature):
Ejecutar en orden según lo que falte:

| Archivo | Qué agrega |
|---|---|
| `migracion_ubicacion_fotos.sql` | Mapa (lat/lng) + bucket Storage |
| `migracion_foto_portada.sql` | Miniatura en listados |
| `migracion_progreso_ciudadano.sql` | Valoraciones Sí/No progresa |
| `migracion_roles_comunitarios.sql` | Roles comunitarios, reportes, estado calculado, vista admin |
| `migracion_resolucion_unica.sql` | 1 aporte resolución por ciudadano y denuncia |

> En el proyecto académico activo (`xynkalcsaubgseoiiavz`), **todas las migraciones ya están aplicadas**, incluida `migracion_roles_comunitarios.sql`.

**Paso 2 — Seed** (opcional, para datos de prueba):
1. Ir a **Supabase → Authentication → Users → Add user**
2. Crear los usuarios de prueba (ciudadano y administradores)
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
SUPABASE_SERVICE_KEY=sb_secret_...        # secret / service_role key
FRONTEND_URL=http://localhost:5173
```

| Variable | Dónde encontrarla | Descripción |
|---|---|---|
| `PORT` | Libre | Puerto del servidor (default: 4000) |
| `SUPABASE_URL` | Project Settings → API → Project URL | URL del proyecto |
| `SUPABASE_SERVICE_KEY` | Project Settings → API Keys → secret | ⚠️ NUNCA exponer al frontend |
| `FRONTEND_URL` | La URL donde corre el frontend | Configura CORS |

> ⚠️ La secret/`service_role` key bypassa Row Level Security — tiene acceso total a la BD. **Nunca** la pongas en el frontend ni la subas a GitHub. El archivo `.env` ya está en `.gitignore`.
>
> 🔐 La verificación de tokens usa el **JWKS** de Supabase (ES256), por lo que **no** se necesita `SUPABASE_JWT_SECRET`. Lo gestiona `backend/src/middleware/auth.js` con la librería `jose`.

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
| **Visitante** | Ver denuncias, panel público (`/panel-publico`) |
| **Ciudadano** | + Crear denuncias, apoyar, marcar progreso (Sí/No), aportes, reportar falsas, mis denuncias |
| **Administrador** | + Moderación (`/admin`): ocultar/restaurar denuncias, ver reportes |

**Estados comunitarios** (calculados en `vista_denuncias`, no editables a mano):

| Estado | Significado |
|---|---|
| `activa` | Sin consenso claro de avance |
| `con_avance` | ≥2 votos “sí progresa” y más sí que no |
| `resuelta` | ≥3 aportes tipo `resolucion` |

**Cómo asignar un rol a un usuario:**

1. Crear el usuario desde **Supabase → Authentication → Users → Add user**
2. Ir a la lista de usuarios, hacer clic en el usuario y copiar su **UUID** (aparece como "User UID")
3. Ir a **SQL Editor** y ejecutar:

```sql
INSERT INTO perfiles (id, nombre, rol)
VALUES ('PEGAR-UUID-AQUI', 'Nombre Apellido', 'ciudadano');

-- Valores válidos para rol: 'ciudadano', 'administrador'
```

El rol se verifica en cada request al backend mediante el middleware `requireRol()` en `backend/src/middleware/auth.js`.

---

## Estados comunitarios — guía completa

El estado **no se guarda en la tabla `denuncias`**. Lo calcula la vista SQL `vista_denuncias` cada vez que se consulta el muro, el detalle o el dashboard.

### Reglas de cálculo (SQL)

```sql
CASE
  WHEN resoluciones >= 3                          THEN 'resuelta'
  WHEN progreso_si >= 2 AND progreso_si > progreso_no THEN 'con_avance'
  ELSE 'activa'
END
```

Fuente: `database/migracion_roles_comunitarios.sql` y `database/schema.sql`.

### Tabla resumen

| Estado | Label en UI | Origen en BD | Umbral |
|---|---|---|---|
| `activa` | ACTIVA | Default | — |
| `con_avance` | CON AVANCE | `valoraciones_progreso` | ≥2 `progresando = true` y sí > no |
| `resuelta` | RESUELTA | `aportes.tipo = 'resolucion'` | ≥3 aportes de usuarios distintos (1 por persona) |

### Acciones en la app (ciudadano)

| Quiero… | Dónde | Qué hacer |
|---|---|---|
| Marcar avance | `/denuncia/:id` | Botones **“Sí progresa”** / **“No progresa”** |
| Confirmar cierre | `/denuncia/:id` | Aporte tipo **“Confirmo que ya se resolvió”** |
| Reportar falsa | `/denuncia/:id` | Sección **“¿Denuncia falsa o abusiva?”** (motivo ≥ 10 caracteres) |

### Acciones del administrador (`/admin`)

| Puede | No puede |
|---|---|
| Ver KPIs (Activas, Con avance, Resueltas, Ocultas, Reportes) | Cambiar estado a mano |
| Ver cola de reportes | Forzar “Con avance” o “Resuelta” |
| **Ocultar** / **Restaurar** denuncias | Crear denuncias (solo ciudadanos) |

### Dónde se refleja el estado

- Chip de color en tarjetas del **muro** (`/`)
- Filtros en **panel público** (`/panel-publico`)
- KPIs en **moderación** (`/admin`)
- Detalle de la denuncia (`/denuncia/:id`)

### Demo rápida (2 cuentas ciudadanas)

```text
1. Adolfo crea denuncia
2. Adolfo → “Sí progresa”
3. Segundo ciudadano (cuenta nueva) → “Sí progresa”  → CON AVANCE
4. Tres ciudadanos distintos confirman resolución           → RESUELTA
5. Axel en /admin ve subir los contadores; puede ocultar si hay reportes
```

> Para cambiar los umbrales (ej. 1 voto en vez de 2, o 2 resoluciones en vez de 3), hay que editar el `CASE` en `vista_denuncias` y volver a ejecutar esa parte en Supabase.

---

## API — Endpoints disponibles

El backend corre en `http://localhost:4000`. Desde el frontend siempre usar `/api/*` (el proxy de Vite lo redirige al backend automáticamente).

### Denuncias

| Método | Ruta | Auth requerida | Descripción |
|---|---|---|---|
| `GET` | `/denuncias` | No | Lista paginada, pública |
| `GET` | `/denuncias/:id` | Opcional | Detalle (+ `mi_progreso` si hay sesión) |
| `POST` | `/denuncias` | ciudadano | Crear nueva denuncia |
| `POST` | `/denuncias/:id/reporte` | ciudadano | Reportar denuncia falsa (`motivo`) |
| `PATCH` | `/denuncias/:id/ocultar` | administrador | Ocultar o restaurar (`oculta: true/false`) |
| `POST` | `/denuncias/:id/apoyo` | cualquier usuario logueado | Toggle de apoyo (1 por usuario) |
| `POST` | `/denuncias/:id/progreso` | ciudadano | Marcar si progresa (`progresando: true/false`, toggle) |
| `GET` | `/denuncias/:id/fotos` | No | Lista de fotos de una denuncia |
| `POST` | `/denuncias/:id/foto` | cualquier usuario logueado | Subir foto (multipart, campo `foto`) |

**Parámetros opcionales de `GET /denuncias`:**
```
?zona_id=1             — filtrar por zona (ID numérico)
?categoria_id=2        — filtrar por categoría (ID numérico)
?estado=activa         — activa | con_avance | resuelta
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
  "anonima": false,
  "latitud": -1.0546,
  "longitud": -80.4545
}
```

`latitud` y `longitud` son opcionales (ubicación marcada en el mapa).

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
Valores válidos para `tipo`: `confirmacion`, `evidencia`, `detalle`, `relacionado`, `resolucion`

**Body de `POST /denuncias/:id/progreso`:**
```json
{ "progresando": true }
```
`true` = sí progresa · `false` = no progresa. Volver a enviar el mismo valor **quita** el voto. Respuesta incluye `mi_progreso`, `total_progreso_si`, `total_progreso_no`.

### Dashboard

| Método | Ruta | Auth requerida | Descripción |
|---|---|---|---|
| `GET` | `/dashboard/public` | No | KPIs, zonas, categorías, tendencia 7 días (solo lectura) |
| `GET` | `/dashboard` | administrador | Estadísticas + conteos de ocultas y reportes |
| `GET` | `/admin/denuncias` | administrador | Cola de moderación (incluye ocultas) |
| `GET` | `/admin/reportes` | administrador | Reportes recientes de denuncias falsas |

---

## Base de datos — Esquema

### Tablas

| Tabla | Descripción |
|---|---|
| `perfiles` | Extiende `auth.users` de Supabase. Contiene `nombre` y `rol`. |
| `categorias` | 9 categorías pre-cargadas por el schema (baches, alumbrado, basura…) |
| `zonas` | 10 barrios/zonas de Portoviejo, pre-cargadas por el schema |
| `denuncias` | Núcleo: autor, categoría, zona, descripción, gravedad, `oculta` |
| `fotos_denuncia` | URLs de fotos subidas a Supabase Storage |
| `aportes` | Confirmaciones, evidencia, detalle, relacionado, **resolucion** |
| `reacciones` | Apoyos — `UNIQUE(denuncia_id, usuario_id)` |
| `valoraciones_progreso` | Opinión ciudadana: ¿progresa? (`progresando` true/false, 1 voto por usuario) |
| `reportes_denuncia` | Reportes de denuncias falsas — `UNIQUE(denuncia_id, usuario_id)` |
| `historial_estados` | *(legacy)* Log histórico; ya no se usa en la app comunitaria |

### Vista `vista_denuncias`

Usada por los endpoints de lectura pública. Une las tablas y:
- Calcula **`estado` comunitario**: `activa` | `con_avance` | `resuelta` (no editable a mano)
- Aplica anonimato: si `anonima = true`, devuelve `NULL` para `autor_id` y `'Ciudadano Anónimo'` para `autor_nombre`
- Calcula `dias_sin_resolver`, `total_apoyos`, `total_aportes`, `total_fotos`, `total_reportes`
- Cuenta `total_progreso_si` y `total_progreso_no` (valoraciones ciudadanas)
- Incluye `foto_portada` (primera foto) para miniaturas en el muro
- Excluye denuncias con `oculta = true`

### Vista `vista_denuncias_admin`

Igual que `vista_denuncias` pero **incluye denuncias ocultas**. La usa el panel `/admin` para moderación.

### Trigger `trg_denuncias_updated_at`

Se dispara en cada `UPDATE` de la tabla `denuncias` y actualiza automáticamente el campo `updated_at`.

### Anonimato

- **Hacia afuera**: si `anonima = true`, la API nunca retorna el `autor_id` ni el nombre real
- **Hacia adentro**: el `autor_id` siempre se almacena en la BD para moderación interna

---

## Ubicación y fotos

### Ubicación (mapa)

`NuevaDenuncia.jsx` incluye un mapa interactivo (Leaflet + OpenStreetMap) centrado en Portoviejo. El ciudadano hace clic para marcar el punto exacto (o usa "Usar mi ubicación" vía GPS del navegador). Las coordenadas se guardan en `denuncias.latitud` / `denuncias.longitud` y se muestran en el detalle. El mapa **requiere internet** (descarga los tiles de OpenStreetMap).

### Fotos (Supabase Storage)

El selector de foto sube la imagen al bucket público `denuncias` de Supabase Storage a través del backend (`POST /denuncias/:id/foto`, con `multer` + service key). La URL pública se guarda en `fotos_denuncia` y las imágenes se muestran en la sección **Fotos** del detalle de la denuncia.

| Restricción | Valor |
|---|---|
| Formatos permitidos | **JPG, PNG, WEBP** |
| Tamaño máximo | 5 MB |
| Formatos NO soportados | **HEIC/HEIF** (fotos de iPhone/Mac) — exportar como JPG antes de subir |

**Flujo:** primero se crea la denuncia (`POST /denuncias`), luego se sube la foto con el `id` recibido. Si la foto falla, la denuncia igual se publica y la app muestra un aviso en el detalle.

> ⚠️ Requiere haber creado el bucket `denuncias` en Supabase (lo crea `schema.sql`; si ya tenías la BD, córrelo con `database/migracion_ubicacion_fotos.sql`).

**Si la foto no aparece:** verifica JPG/PNG/WEBP (no HEIC), máximo 5 MB, bucket `denuncias` en Storage.

### Valoraciones de progreso y resolución comunitaria

En el detalle (`/denuncia/:id`), los **ciudadanos** pueden:

- **Marcar progreso** — botones “Sí progresa” / “No progresa”. Alimenta el estado `con_avance` (ver [guía de estados](#estados-comunitarios--guía-completa)).
- **Confirmar resolución** — aporte tipo `resolucion` (“Confirmo que ya se resolvió”). Con **3 o más**, la denuncia pasa a `resuelta`.

Los conteos de progreso se ven en detalle y en las tarjetas del muro como `↑N ↓M`.

> Requiere `database/migracion_progreso_ciudadano.sql`, `database/migracion_roles_comunitarios.sql` y `database/migracion_resolucion_unica.sql` si la BD se creó antes de estas funcionalidades.

### Panel público vs panel de gestión

| Ruta | Quién | Qué hace |
|---|---|---|
| `/panel-publico` | Todos (visitantes incluidos) | Estadísticas + listado de denuncias **solo lectura** |
| `/admin` | administrador | KPIs + reportes + **ocultar/restaurar** denuncias |

---

## Lo que falta implementar

### Para conectar y entregar

- [x] Configurar Supabase — proyecto, schema, migraciones, `.env`, usuarios de prueba ✅
- [x] Subida de fotos — Storage + validación de formatos ✅
- [x] Ubicación en mapa — Leaflet ✅
- [x] Panel público y valoraciones de progreso ✅
- [x] Roles comunitarios, reportes y moderación admin ✅

### Media prioridad

- [ ] **Notificaciones por email** — avisar al ciudadano cuando su denuncia cambia de estado comunitario (Supabase Edge Functions)

### Post-entrega

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
| `brand.red` | `#B83232` | Alertas, estado activa | `#E11900` |
| `brand.green` | `#0E7A45` | Estado resuelta | igual |
| `brand.amber` | `#C87D00` | Estado con avance | `#E8A300` |
| `surface.base` | `#F7F6F2` | Fondo general | `#dcdbd5` |
| `surface.card` | `#FFFFFF` | Tarjetas | — |
| `ink.DEFAULT` | `#1A1A1A` | Texto principal | `#0a0a0a` |

### Tipografía

- **Anton** — Titulares de denuncias (estilo periódico/editorial)
- **Archivo** — Cuerpo de texto
- **Space Mono** — Metadatos, chips, etiquetas técnicas

---

## Decisiones de diseño importantes

**¿Por qué email + contraseña?**
Para el entorno académico y las pruebas locales, el login por email + contraseña (`signInWithPassword`) permite entrar al instante sin depender de recibir correos. La verificación del token sigue siendo segura: el backend valida el JWT (ES256) contra el JWKS de Supabase.

**¿Por qué el backend usa `service_role` y no la anon key?**
La anon key respeta RLS, lo que puede bloquear inserciones o lecturas según las políticas definidas. El backend con `service_role` tiene control total y aplica su propia lógica de autorización (verificación de JWT + rol), siendo más predecible y explícito que RLS solo.

**¿Por qué no usar Supabase directamente desde el frontend para todo?**
Hay operaciones que requieren lógica de negocio en el servidor: generar el titular, validar roles, registrar reportes, subir fotos a Storage y calcular el estado comunitario vía vistas SQL.

**Modelo comunitario (sin municipio/cuadrilla):**
El estado de una denuncia **no lo cambia un admin**. Lo calcula la vista según votos de progreso y aportes tipo `resolucion`. El admin solo **oculta o restaura** denuncias reportadas como falsas o abusivas.

**¿Por qué centralizar las constantes en `lib/constants.js`?**
Las listas de categorías, zonas y estados se usaban en 5-6 archivos distintos. Si hay que agregar una zona nueva o cambiar un label, se edita un solo archivo y se propaga a toda la app.

**Anonimato con responsabilidad**: el `autor_id` siempre se guarda en la BD. El ciudadano ve "Ciudadano Anónimo" en el muro; un administrador con acceso a Supabase puede identificar al autor si hay abuso.

---

## Autor

Desarrollado por Axel Hernández — PUCE Sede Manabí, Portoviejo, Manabí — 2025.
