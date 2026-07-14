# División del equipo — PortoSinFiltro

> Documento para repartir módulos en Jira entre los 4 integrantes.  
> Proyecto: **PortoSinFiltro — El Muro de la Vergüenza** · PUCE Sede Manabí.

---

## Equipo

| Integrante | Módulo | Rol en la demo | Usuario de prueba |
|------------|--------|----------------|-------------------|
| **Axel** | M2 — API Backend | Explica endpoints, seguridad y permisos | `axel@demo.com` (administrador) |
| **Elkin** | M1 — Base de datos e Supabase | Explica tablas, vistas y estados comunitarios | `elkin@demo.com` (administrador) |
| **Marcelo** | M4 — Gestión, transparencia y entrega | Explica panel admin, panel público y deploy | `marcelo@demo.com` (administrador) |
| **Adolfo** | M3 — Experiencia ciudadana | Demuestra flujo completo del ciudadano | `adolfo@demo.com` (ciudadano) |

---

## Resumen por persona

### Axel — M2: API Backend

**Carpeta principal:** `backend/src/`

| Qué le toca | Archivos |
|-------------|----------|
| Servidor Express, CORS, seguridad | `backend/src/index.js` |
| Verificación JWT y roles | `backend/src/middleware/auth.js` |
| CRUD denuncias, apoyo, progreso, fotos, reportes | `backend/src/routes/denuncias.js` |
| Aportes (incl. resolución) | `backend/src/routes/aportes.js` |
| Dashboard público y admin | `backend/src/routes/dashboard.js` |
| Cola de moderación | `backend/src/routes/admin.js` |
| Cliente Supabase (service role) | `backend/src/db/supabase.js` |
| Wrapper API (coordinación con frontend) | `frontend/src/lib/api.js` |

**Epic en Jira:** `PSF-M2 — API Backend`

**Historias sugeridas:**

| ID | Historia | Estado |
|----|----------|--------|
| PSF-10 | Como frontend, consumo denuncias vía API REST | ✅ Done |
| PSF-11 | Como ciudadano, puedo apoyar y votar progreso (toggle) | ✅ Done |
| PSF-12 | Como ciudadano, puedo aportar evidencia y confirmar resolución | ✅ Done |
| PSF-13 | Como ciudadano, puedo reportar denuncias falsas | ✅ Done |
| PSF-14 | Como administrador, puedo ocultar/restaurar denuncias | ✅ Done |
| PSF-15 | Como visitante, veo estadísticas públicas sin login | ✅ Done |
| PSF-16 | Las peticiones están protegidas (JWT, helmet, rate limit) | ✅ Done |
| PSF-17 | Desplegar backend en servidor de producción/demo | ⏳ Pendiente |
| PSF-18 | Validar todos los endpoints con checklist por rol | ⏳ Pendiente |

**Subtareas pendientes (PSF-17 / PSF-18):**
- [ ] Configurar `backend/.env` en el servidor (sin subir secret key a Git)
- [ ] Probar `GET /health`
- [ ] Probar `POST /denuncias` como ciudadano
- [ ] Probar `PATCH /ocultar` como administrador
- [ ] Probar que visitante no puede crear denuncias (401/403)
- [ ] Documentar en Jira cualquier bug encontrado

---

### Elkin — M1: Base de datos e infraestructura Supabase

**Carpeta principal:** `database/`

| Qué le toca | Archivos |
|-------------|----------|
| Schema completo | `database/schema.sql` |
| Migraciones | `database/migracion_*.sql` |
| Datos de prueba | `database/seed.sql` |
| Config Auth en Supabase | Dashboard → Authentication |
| Bucket de fotos | Storage → bucket `denuncias` |
| Usuarios demo y perfiles | Auth + SQL Editor |

**Epic en Jira:** `PSF-M1 — Base de datos e infraestructura Supabase`

**Historias sugeridas:**

| ID | Historia | Estado |
|----|----------|--------|
| PSF-1 | Schema inicial: tablas, triggers, RLS | ✅ Done |
| PSF-2 | Ubicación (lat/lng) y fotos en Storage | ✅ Done |
| PSF-3 | Roles comunitarios y vista `vista_denuncias` | ✅ Done |
| PSF-4 | Resolución única por ciudadano por denuncia | ✅ Done |
| PSF-5 | Usuarios de prueba y perfiles (Axel, Elkin, Marcelo, Adolfo) | ✅ Done |
| PSF-6 | Verificar que todas las migraciones están aplicadas en Supabase | ⏳ Pendiente |
| PSF-7 | Documentar esquema (tablas, vistas, triggers) para el informe | ⏳ Pendiente |

**Subtareas pendientes (PSF-6 / PSF-7):**
- [ ] Ejecutar en SQL Editor: `SELECT nombre, rol FROM perfiles ORDER BY rol, nombre;`
- [ ] Confirmar que existen las vistas `vista_denuncias` y `vista_denuncias_admin`
- [ ] Confirmar bucket `denuncias` en Storage
- [ ] Revisar Supabase Advisors (seguridad/rendimiento)
- [ ] Compartir **secret key** al equipo solo por canal privado (nunca en Git)
- [ ] Armar diagrama o tabla resumen de tablas para la presentación

**Checklist Auth (referencia):**
```
Site URL:       http://localhost:5173
Redirect URLs:  http://localhost:5173, http://localhost:5173/*
Email provider: activado
Confirm email:  desactivado (para demo en vivo)
```

---

### Marcelo — M4: Gestión, transparencia y entrega

**Carpeta principal:** `frontend/src/pages/Admin.jsx`, `PanelPublico.jsx`, `Layout.jsx` + docs

| Qué le toca | Archivos |
|-------------|----------|
| Panel de moderación admin | `frontend/src/pages/Admin.jsx` |
| Estadísticas públicas | `frontend/src/pages/PanelPublico.jsx` |
| Navegación y header por rol | `frontend/src/components/layout/Layout.jsx` |
| Constantes compartidas | `frontend/src/lib/constants.js` |
| Rutas globales | `frontend/src/App.jsx` |
| Documentación del proyecto | `README.md`, `docs/*` |
| Deploy frontend | Vercel u otro hosting |
| Guion de presentación | Este doc + checklist demo |

**Epic en Jira:** `PSF-M4 — Gestión, transparencia y entrega`

**Historias sugeridas:**

| ID | Historia | Estado |
|----|----------|--------|
| PSF-30 | Como administrador, moderó denuncias desde `/admin` | ✅ Done |
| PSF-31 | Como administrador, veo reportes de denuncias falsas | ✅ Done |
| PSF-32 | Como visitante, consulto estadísticas en `/panel-publico` | ✅ Done |
| PSF-33 | La navegación muestra Admin solo a administradores | ✅ Done |
| PSF-34 | Documentación de handoff para el equipo | ✅ Done |
| PSF-35 | Desplegar frontend (build + variables de entorno) | ⏳ Pendiente |
| PSF-36 | Preparar guion de presentación (~10 min) | ⏳ Pendiente |
| PSF-37 | Ejecutar checklist completo de prueba (13 pasos) | ⏳ Pendiente |

**Subtareas pendientes (PSF-35 / PSF-36 / PSF-37):**
- [ ] `npm run build` en frontend sin errores
- [ ] Configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en hosting
- [ ] Apuntar API de producción (proxy o URL del backend de Axel)
- [ ] Escribir guion: quién habla en cada paso de la demo
- [ ] Correr checklist del README (pasos 1–13) y anotar bugs en Jira
- [ ] Actualizar README si cambia la URL de producción

**Guion de demo sugerido ( reparto de palabra ):**

| Paso | Quién | Qué muestra |
|------|-------|-------------|
| 1 | Marcelo | Muro + filtros ACTIVA / CON AVANCE / RESUELTA |
| 2–4 | Adolfo | Login ciudadano, crear denuncia, ver en muro |
| 5–7 | Adolfo | Detalle: apoyo, progreso, indicador «cuánto falta» |
| 8 | Adolfo | Reportar denuncia falsa |
| 9 | Adolfo | `/mis-denuncias` |
| 10 | Marcelo | `/panel-publico` |
| 11–12 | Marcelo | Login admin → `/admin` → ocultar y restaurar |
| 13 | Adolfo + otro ciudadano | 3 confirmaciones de resolución → RESUELTA |
| Cierre | Elkin | Cómo se calcula el estado en SQL (vista) |
| Cierre | Axel | Cómo la API valida roles y JWT |

---

### Adolfo — M3: Experiencia ciudadana (Frontend)

**Carpeta principal:** `frontend/src/pages/` (ciudadano) + componentes UI

| Qué le toca | Archivos |
|-------------|----------|
| Muro de denuncias | `frontend/src/pages/Muro.jsx` |
| Detalle e interacción comunitaria | `frontend/src/pages/DetalleDenuncia.jsx` |
| Crear denuncia (mapa + foto) | `frontend/src/pages/NuevaDenuncia.jsx` |
| Mis denuncias | `frontend/src/pages/MisDenuncias.jsx` |
| Login y registro | `frontend/src/pages/Login.jsx` |
| Tarjeta, gravedad, mapa | `frontend/src/components/ui/*` |
| Mensajes de estado comunitario | `frontend/src/lib/estadoComunitario.js` |

**Epic en Jira:** `PSF-M3 — Experiencia ciudadana`

**Historias sugeridas:**

| ID | Historia | Estado |
|----|----------|--------|
| PSF-20 | Como visitante, veo el muro con filtros por estado | ✅ Done |
| PSF-21 | Como ciudadano, registro denuncia con mapa y foto | ✅ Done |
| PSF-22 | Como ciudadano, veo detalle y participo (apoyo, progreso, aportes) | ✅ Done |
| PSF-23 | Como ciudadano, reporto denuncia falsa | ✅ Done |
| PSF-24 | Como ciudadano, confirmo resolución (máx. 1 vez) | ✅ Done |
| PSF-25 | Como ciudadano, veo mis denuncias (incl. anónimas) | ✅ Done |
| PSF-26 | Como usuario nuevo, me registro e inicio sesión | ✅ Done |
| PSF-27 | Flujo ciudadano funciona sin errores en demo | ⏳ Pendiente |
| PSF-28 | UI responsive en móvil (muro y detalle) | ⏳ Pendiente |

**Subtareas pendientes (PSF-27 / PSF-28):**
- [ ] Probar crear denuncia con foto JPG (no HEIC)
- [ ] Probar mapa: clic manual + «Usar mi ubicación»
- [ ] Probar apoyo persiste al recargar
- [ ] Probar 2 ciudadanos distintos → CON AVANCE
- [ ] Probar 3 ciudadanos distintos → RESUELTA
- [ ] Revisar muro y detalle en pantalla de celular
- [ ] Anotar bugs en Jira con captura si aplica

---

## Cómo crear el board en Jira

### 1. Crear el proyecto

- **Nombre:** PortoSinFiltro
- **Clave sugerida:** `PSF`
- **Tipo:** Scrum o Kanban (lo que pida el curso)

### 2. Crear 4 Epics (uno por persona)

| Epic | Asignado | Etiqueta sugerida |
|------|----------|-------------------|
| PSF-M1 — Base de datos e infraestructura Supabase | Elkin | `modulo-m1`, `supabase` |
| PSF-M2 — API Backend | Axel | `modulo-m2`, `backend` |
| PSF-M3 — Experiencia ciudadana | Adolfo | `modulo-m3`, `frontend` |
| PSF-M4 — Gestión, transparencia y entrega | Marcelo | `modulo-m4`, `admin`, `deploy` |

### 3. Crear historias bajo cada Epic

Usar las tablas de arriba (PSF-1 a PSF-37). Marcar como **Done** lo que ya está implementado y **To Do** lo pendiente.

### 4. Agregar subtareas a cada historia

Cada subtarea = una acción concreta verificable (ver listas `[ ]` de cada persona arriba).

### 5. Plantilla de historia (copiar/pegar)

```
Título: Como [rol], quiero [acción] para [beneficio]

Descripción:
Módulo: M3 — Experiencia ciudadana
Responsable: Adolfo
Archivos: frontend/src/pages/DetalleDenuncia.jsx

Criterios de aceptación:
- [ ] Criterio 1
- [ ] Criterio 2
- [ ] Criterio 3

Depende de: PSF-10 (API de denuncias — Axel)
```

---

## Dependencias entre módulos

```
Elkin (M1 Supabase)
    ↓
Axel (M2 Backend)
    ↓
Adolfo (M3 Ciudadano)  +  Marcelo (M4 Admin/Deploy)
```

| Si trabajas en… | Necesitas que esté listo… | De parte de… |
|-----------------|---------------------------|--------------|
| Backend (Axel) | Schema y migraciones aplicadas | Elkin |
| Frontend ciudadano (Adolfo) | API `/denuncias`, `/aportes` funcionando | Axel |
| Admin (Marcelo) | API `/admin`, `/dashboard` funcionando | Axel |
| Deploy (Marcelo) | Backend desplegado | Axel |
| Demo completa | `.env` de todos + usuarios demo | Elkin |

En Jira: usar enlace **«is blocked by»** cuando una tarea dependa de otra.

---

## Sprint sugerido (2 semanas)

### Sprint 1 — Verificación (semana 1)

| Persona | Tareas Jira | Meta |
|---------|-------------|------|
| Elkin | PSF-6, PSF-7 | BD verificada y documentada |
| Axel | PSF-18 | API probada por rol |
| Adolfo | PSF-27, PSF-28 | Flujo ciudadano estable |
| Marcelo | PSF-37 | Checklist 13 pasos ejecutado |

### Sprint 2 — Entrega (semana 2)

| Persona | Tareas Jira | Meta |
|---------|-------------|------|
| Axel | PSF-17 | Backend en servidor |
| Marcelo | PSF-35, PSF-36 | Frontend desplegado + guion listo |
| Elkin | Apoyo en demo SQL | Explicar estados comunitarios |
| Adolfo | Apoyo en demo ciudadana | Segunda cuenta para votos/resoluciones |

---

## Reglas del equipo

1. **Un dueño por módulo** — el resto puede ayudar, pero los bugs y tareas Jira van al dueño del Epic.
2. **No commitear secret keys** — `backend/.env` nunca va a Git.
3. **Coordinar cambios en archivos compartidos** — `api.js`, `constants.js`, `App.jsx`: avisar en el grupo antes de editar.
4. **Estados comunitarios** — nadie cambia ACTIVA/CON AVANCE/RESUELTA a mano; lo calcula la vista SQL (Elkin) y la consume la API (Axel).
5. **Demo en vivo** — tener Plan B: abrir `index.html` de la raíz si Supabase falla.

---

## Contacto rápido por tema

| Tema | Preguntar a… |
|------|--------------|
| Error en login / usuarios / permisos BD | Elkin |
| Error 401/403/500 en API | Axel |
| UI del muro, detalle, nueva denuncia | Adolfo |
| Panel admin, deploy, documentación | Marcelo |
| Secret key de Supabase | Elkin (canal privado) |

---

## Estado general del proyecto

| Área | Estado |
|------|--------|
| Schema + migraciones | ✅ Implementado |
| API Backend | ✅ Implementado |
| Frontend ciudadano | ✅ Implementado |
| Panel admin + panel público | ✅ Implementado |
| Deploy | ⏳ Pendiente |
| Checklist demo completo | ⏳ Pendiente |

---

*Última actualización: julio 2026 · Equipo PortoSinFiltro — Axel, Elkin, Marcelo, Adolfo*
