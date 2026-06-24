# Plan: roles comunitarios (ciudadano + administrador)

> PortoSinFiltro deja de depender de municipio/cuadrilla. La plataforma es **ciudadana e independiente**; el admin **modera** (ocultar falsas/abuso); el **estado** de una denuncia lo refleja la **comunidad**.

## Decisiones acordadas

| Tema | Decisión |
|------|----------|
| Roles | `ciudadano` + `administrador` (varios admins, asignados manual en Supabase) |
| Estado oficial municipal | **Eliminado** — no hay PATCH de estado por institución |
| Estado en UI | **Comunitario**, calculado en la vista |
| Admin | Solo **ocultar / restaurar** denuncias (`oculta`) |
| Ciudadanos | Pueden **reportar denuncia falsa** (1 reporte por usuario por denuncia) |
| Panel público | Se mantiene (transparencia) |
| Panel gestión | Pasa a **`/admin`** — cola de reportes + denuncias ocultas |

---

## Estados comunitarios (redefinidos)

| Estado | Significado | Cómo se calcula |
|--------|-------------|-----------------|
| **activa** | El problema sigue visible, sin consenso claro de avance | Default |
| **con_avance** | La comunidad ve mejora | `progreso_si > progreso_no` y al menos **2** votos “sí progresa” |
| **resuelta** | La comunidad considera el caso cerrado | Al menos **3** aportes tipo `resolucion` (“Confirmo que ya se resolvió”) |

Los filtros del muro y panel usan estos tres valores (vienen de `vista_denuncias.estado`, **calculado**, no editable a mano).

---

## Modelo de datos

### Cambios en `perfiles.rol`

```sql
CHECK (rol IN ('ciudadano', 'administrador'))
```

Migración: `cuadrilla` y `municipio` → `administrador` (manual o en SQL).

### Nueva tabla `reportes_denuncia`

```sql
id, denuncia_id, usuario_id, motivo (TEXT, max 300), created_at
UNIQUE (denuncia_id, usuario_id)
```

### Aportes — nuevo tipo

Añadir `resolucion` al CHECK de `aportes.tipo` para confirmaciones comunitarias de cierre.

### Denuncias

- Mantener `oculta` (admin la pone en `true`).
- **`estado` deja de guardarse en tabla `denuncias`** — solo se expone calculado en la vista (columna `estado` en vista = comunitario).
- `cuadrilla_id` y `historial_estados`: deprecados (no se usan en UI; se pueden dejar en BD por compatibilidad académica).

### Vista `vista_denuncias`

- `estado` = CASE comunitario (activa / con_avance / resuelta).
- Contadores existentes + `total_reportes`.
- Excluye `oculta = true` (como ahora).

---

## API (backend)

| Método | Ruta | Rol | Acción |
|--------|------|-----|--------|
| `POST` | `/denuncias/:id/reporte` | ciudadano | Reportar falsa (`motivo`) |
| `PATCH` | `/denuncias/:id/ocultar` | administrador | `{ oculta: true\|false, motivo? }` |
| `GET` | `/admin/denuncias` | administrador | Lista con ocultas + conteo reportes |
| `GET` | `/admin/reportes` | administrador | Reportes recientes |
| ~~`PATCH`~~ | ~~`/denuncias/:id/estado`~~ | — | **Eliminar** |
| `GET` | `/dashboard` | administrador | Stats gestión (antes municipio) |

Aportes: permitir `tipo: 'resolucion'` en POST.

---

## Frontend

| Área | Cambio |
|------|--------|
| `Layout` | Link **Admin** solo `administrador`; quitar Panel municipio |
| `Panel.jsx` | → **`Admin.jsx`** en `/admin` (ocultar/restaurar, ver reportes) |
| `PanelPublico` | Filtros estado: ACTIVA / CON AVANCE / RESUELTA |
| `DetalleDenuncia` | Botón “Reportar como falsa”; aporte tipo resolución; copy sin “municipio” |
| `constants.js` | `ESTADO_LABEL`, `ESTADO_COLOR` comunitarios |
| Login copy | Sin referencias a gestión municipal |

---

## Fases de implementación (1 commit por fase)

| Fase | Contenido | Commit |
|------|-----------|--------|
| **0** | Este plan | `docs: plan roles comunitarios` |
| **1** | SQL migración + `schema.sql` | `feat(db): roles ciudadano/admin y estado comunitario` |
| **2** | Backend: roles, reportes, ocultar, quitar PATCH estado, tipo resolucion | `feat(api): moderación admin y señales comunitarias` |
| **3** | Frontend admin `/admin` + navegación | `feat: panel admin ocultar denuncias` |
| **4** | Frontend ciudadano: reportar falsa, resolución, estados UI, copy | `feat: reportes y estado comunitario en UI` |
| **5** | README, PRODUCT.md, usuarios demo | `docs: actualizar handoff roles comunitarios` |

---

## Demo universitaria (nuevo guion)

1. Ciudadano registra denuncia con foto y mapa.
2. Otro ciudadano apoya, marca progreso, aporta evidencia.
3. Varios confirman resolución → estado pasa a **resuelta** en el muro.
4. Panel público muestra estadísticas abiertas.
5. Ciudadano reporta una denuncia sospechosa.
6. Admin entra a `/admin`, ve reportes, **oculta** la denuncia.
7. Denuncia desaparece del muro; admin puede restaurar.

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Manipular votos de resolución | Umbral ≥3 aportes; admin puede ocultar |
| Reportes abusivos | 1 reporte por usuario; admin decide |
| BD en Supabase ya desplegada | Script `migracion_roles_comunitarios.sql` idempotente |
| Perfiles con rol viejo | UPDATE en migración + checklist manual |

---

## Pendiente post-MVP (no en este plan)

- Banear usuarios (`activo = false`) desde admin UI
- Notificaciones email
- Mapa agregado de denuncias por zona
