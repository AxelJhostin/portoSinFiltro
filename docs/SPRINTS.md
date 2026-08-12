# Registro de sprints — PortoSinFiltro

Artefactos ágiles del proyecto: product backlog, sprint backlog, sprint review y
retrospectiva de cada iteración.
PUCE Sede Manabí · Ingeniería de Software · *Desarrollo de Sistemas de Información* 2026-1.

Complementa a [`ARQUITECTURA.md` § 1](ARQUITECTURA.md#1-metodología-elección-y-justificación),
donde está la justificación de por qué se eligió Scrum, y a
[`EQUIPO-Y-MODULOS.md`](EQUIPO-Y-MODULOS.md), donde está el reparto de módulos.

## Cómo leer este documento

La **fuente de verdad es el tablero** [Jira `SCRUM`](https://codificandote.atlassian.net/jira/software/projects/SCRUM/boards).
Este documento no reemplaza al tablero: lo consolida en el repositorio para que los
artefactos de la metodología se puedan leer sin credenciales de Atlassian.

Dos advertencias de honestidad, para que nada de lo que sigue se lea como más prolijo de
lo que fue:

1. **Las iteraciones están delimitadas por fecha de resolución de los tickets, no por
   objetos `Sprint` de Jira.** El campo Sprint solo se usó en la primera iteración; a
   partir de ahí el tablero funcionó como un backlog continuo con estados. Las fechas de
   corte de abajo son quincenas contadas desde el primer ticket creado.
2. **Parte de las subtareas se redactaron después de escribir el código**, para dar
   trazabilidad fina a trabajo ya entregado. Se señala dónde ocurrió y qué se concluyó de
   eso en la retrospectiva de la iteración 4.

Todas las cifras de este documento son verificables con las consultas JQL de la
[sección 6](#6-métricas-y-cómo-verificarlas).

---

## 1. Product Backlog

El backlog se estructuró en **ocho épicas**, una por módulo del sistema. Cada épica
declara sus requisitos funcionales (`RF`) y no funcionales (`RNF`) con criterios de
aceptación; el detalle completo vive en la descripción de la épica en Jira.

| Épica | Alcance | Dueño | Requisitos |
|---|---|---|---|
| [`SCRUM-18`](https://codificandote.atlassian.net/browse/SCRUM-18) Gestión de Usuarios y Autenticación | Registro, login, RBAC, RLS, tabla `perfiles` | Axel | RF-01, RF-02, RF-03, RNF-01, RNF-03 |
| [`SCRUM-19`](https://codificandote.atlassian.net/browse/SCRUM-19) Registro y Gestión de Denuncias | Formulario, fotos, titular, anonimato | Axel | RF-04, RF-05, RF-14, RNF-04, RNF-10 |
| [`SCRUM-20`](https://codificandote.atlassian.net/browse/SCRUM-20) Muro Público | Feed, apoyos, lectura sin sesión, filtros | Adolfo | RF-07, RF-08, RF-12, RF-13 |
| [`SCRUM-21`](https://codificandote.atlassian.net/browse/SCRUM-21) Seguimiento Ciudadano | Cierre del ciclo de vida de la denuncia | Adolfo | RF-09, RF-10, RF-11 |
| [`SCRUM-22`](https://codificandote.atlassian.net/browse/SCRUM-22) Anonimato y Moderación | Reporte comunitario, panel de moderación | Johan | RF-15, RNF-13 |
| [`SCRUM-23`](https://codificandote.atlassian.net/browse/SCRUM-23) Estadísticas Públicas | Panel de transparencia, KPIs, mapa | Adolfo | RF-16, RF-17 |
| [`SCRUM-24`](https://codificandote.atlassian.net/browse/SCRUM-24) Aporte Colaborativo | Confirmaciones, evidencia, detalle | Johan | RF-06 |
| [`SCRUM-25`](https://codificandote.atlassian.net/browse/SCRUM-25) Infraestructura y Configuración Técnica | Base técnica, seguridad, modularidad, CI | Elkin | RNF-02, RNF-05 a RNF-09, RNF-11, RNF-12 |

**Priorización.** El orden no fue por valor percibido sino por **dependencia técnica**:
esquema de base de datos antes que API, API antes que interfaz, interfaz antes que
despliegue. La consecuencia práctica es que `SCRUM-25` (infraestructura) no fue un módulo
que se cerrara al final, sino el que tuvo que abrirse primero y volver a tocarse en cada
iteración.

---

## 2. Las cuatro iteraciones

### Iteración 1 — Del esqueleto al modelo comunitario
**24 de junio al 7 de julio de 2026 · 33 tickets finalizados**

**Objetivo del sprint.** Tener el repositorio, el esquema de base de datos y el circuito
completo de una denuncia: crearla, verla en el muro y abrir su detalle.

**Entregado.** Repositorio y estructura inicial, arquitectura decidida, esquema en
Supabase, autenticación con email y contraseña, registro de ciudadanos, formulario de
denuncia, muro con tarjetas, página de detalle, apoyos, votos de progreso, mapa con
Leaflet, subida de fotos a Storage, panel público de solo lectura, moderación de
administrador, y tres documentos de diseño del modelo de roles.

**Sprint review.** Al cierre se pudo demostrar el flujo completo en local: un ciudadano se
registra, publica una denuncia con foto y ubicación, y otro ciudadano la apoya y vota si
progresa. Todavía sin despliegue público.

**Retrospectiva.**

| Qué pasó | Evidencia | Qué se decidió |
|---|---|---|
| **El modelo de dominio cambió a mitad de la iteración.** Se construyó un panel para municipio y cuadrilla, y después se descartó: el estado de una denuncia lo calcula la comunidad, no una institución. | Ticket «Panel municipalidad/cuadrilla (`/panel`)» finalizado, y a continuación «Roles ciudadano/admin — schema, migración, vista» y «Doc: plan de migración a roles ciudadano y administrador» | Documentar la decisión antes de migrar el esquema. De ahí salió [`PLAN-ROLES-COMUNITARIOS.md`](PLAN-ROLES-COMUNITARIOS.md). Es la razón por la que se descartó cascada como metodología. |
| **Una migración destructiva falló contra la base real.** El `UPDATE` de roles se ejecutó antes de eliminar el `CHECK` viejo de `perfiles.rol` y Postgres lo rechazó con error `23514`. | Ticket «Migración roles — fix orden `CHECK` constraint antes de `UPDATE`» | Toda migración que toque una restricción se ordena explícitamente: quitar restricción → migrar datos → crear restricción nueva. Ver el bloque de aviso en el `README`. |
| **Aparecieron duplicaciones al crecer las pantallas.** | Tickets «Refactor: centralizar constantes compartidas» y «Refactor: shared Layout, filtros, páginas MisDenuncias y 404» | Centralizar catálogos y estados en `frontend/src/lib/constants.js` y extraer un `Layout` compartido, en la misma iteración y no como deuda. |

---

### Iteración 2 — El sprint de mayor volumen
**8 al 21 de julio de 2026 · 93 tickets finalizados**

**Objetivo del sprint.** Cerrar las reglas del modelo comunitario, endurecer el backend y
levantar la suite de pruebas con integración continua.

**Entregado.** Es la iteración con más entrega del proyecto: consolidación de los estados
comunitarios y sus umbrales, resolución única por ciudadano, reportes de denuncia falsa,
cola de moderación, gestión de usuarios, endurecimiento de seguridad del backend
(`helmet`, límite de peticiones, CORS por lista blanca, validación de variables de
entorno), verificación de JWT contra el JWKS de Supabase, y la suite de pruebas con
GitHub Actions.

**Sprint review.** Al cierre la aplicación tenía las reglas de negocio completas y la
suite de pruebas en verde en CI. El estado de una denuncia ya no era editable por nadie:
lo calculaba la vista SQL.

**Retrospectiva.**

| Qué pasó | Qué se decidió |
|---|---|
| **El volumen de 93 tickets en dos semanas no fue una mejora de productividad**, sino el efecto de haber fragmentado el trabajo en subtareas mucho más finas que en la iteración 1. La velocidad medida en tickets dejó de ser comparable entre iteraciones. | Dejar de leer «tickets cerrados» como medida de avance y usar el cierre de épicas y el estado del despliegue como señal real. |
| **La decisión de calcular el estado en SQL en vez de guardarlo** resultó ser la de mayor impacto del proyecto: eliminó de raíz la posibilidad de que el estado quede desincronizado de la evidencia. | Sostenerla y documentarla como decisión de arquitectura ([`ARQUITECTURA.md` § 6](ARQUITECTURA.md#6-diagrama-de-estados-uml)). |
| **La cobertura de pruebas creció mucho más rápido en el backend que en el frontend**, porque el backend ya estaba modularizado por rutas y el frontend concentraba lógica en páginas grandes. | Reconocido como deuda técnica; ver la retrospectiva consolidada. |

---

### Iteración 3 — Despliegue a producción
**22 de julio al 4 de agosto de 2026 · 5 tickets finalizados**

**Objetivo del sprint.** Poner la aplicación en un dominio público y dejar lista la
logística de la sustentación.

**Entregado.** Despliegue del proyecto en Vercel con frontend y API en el mismo dominio
([`SCRUM-212`](https://codificandote.atlassian.net/browse/SCRUM-212),
[`SCRUM-213`](https://codificandote.atlassian.net/browse/SCRUM-213)), variables de entorno
de producción, credenciales de los roles de demostración y verificación del video de
respaldo.

**Sprint review.** La aplicación quedó accesible y verificable en vivo en
<https://porto-sin-filtro.vercel.app>.

**Retrospectiva.**

| Qué pasó | Qué se decidió |
|---|---|
| **Es la iteración con menos tickets cerrados de todo el proyecto: 5 frente a 93 de la anterior.** El trabajo de despliegue es difícil de fragmentar (o el sitio responde o no responde) y coincidió con un período de baja disponibilidad del equipo. | El indicador de tickets no distingue «poco trabajo» de «trabajo poco divisible». Para infraestructura, medir por hito verificable —la URL responde— y no por conteo. |
| **El despliegue dejó de ser un riesgo abierto tres semanas antes del examen.** | Confirmó la prioridad por dependencia técnica: desplegar temprano y no la víspera. |

---

### Iteración 4 — Endurecimiento, trazabilidad y entregables
**5 al 12 de agosto de 2026 · 52 tickets finalizados**

**Objetivo del sprint.** Cerrar los entregables de la rúbrica, verificar el estado real de
la base de datos desplegada y endurecer los flujos que solo se habían probado a mano.

**Entregado.** Verificación de migraciones contra el proyecto real
(`backend/scripts/verificar-migraciones.mjs`), corrección de `seed.sql` para que sea
idempotente, PWA instalable con service worker, mapa agregado con privacidad de
coordenadas para denuncias anónimas, manejo de errores con reintento en el panel de
administración, matriz de formatos de imagen con rechazo verificado de HEIC, auditoría de
divergencias entre el Plan B y la aplicación real, prueba offline del prototipo, y la
documentación de modularidad y de la suite de pruebas en el `README`.

**Sprint review.** Al cierre existen los tres entregables técnicos del repositorio:
script de base de datos, diagramas y documentación, y suite de pruebas con CI, sobre una
aplicación desplegada y accesible.

**Retrospectiva.**

| Qué pasó | Qué se decidió |
|---|---|
| **Se crearon subtareas para documentar trabajo ya hecho.** Varias subtareas cerradas en esta iteración describen trabajo entregado en junio (por ejemplo, la creación de la tabla `perfiles` o la configuración de RLS). Se hizo para que cada entregable tuviera un ticket rastreable, pero significa que el tablero no refleja *cuándo* se hizo ese trabajo. | Es la principal lección de gestión del proyecto: **el ticket se escribe antes del código, no después**. Reconstruir trazabilidad al final cuesta más y produce un tablero que miente sobre las fechas. |
| **Un fallo real solo apareció en QA manual, no en las pruebas automatizadas:** el rechazo de fotos HEIC. La suite mockea Supabase y no sube archivos reales. | Límite conocido y aceptado de la suite: cubre lógica y contratos HTTP, no el comportamiento con archivos reales ni el navegador. Cerrarlo exigiría pruebas end-to-end, fuera del alcance de este semestre. |
| **El Plan B se había desincronizado de la aplicación real.** | Auditar las divergencias y documentar cuáles se mantienen a propósito, en vez de dejar que parezcan errores. Ver la sección *Divergencias conocidas* del `README`. |

---

## 3. Retrospectiva consolidada del proyecto

Lo que el equipo se lleva del semestre, en orden de importancia.

**Lo que funcionó.**

La priorización por dependencia técnica evitó el bloqueo clásico de tener interfaz sin
API. Calcular el estado en SQL en lugar de almacenarlo eliminó una clase entera de
errores. Desplegar tres semanas antes del examen convirtió el riesgo más alto del proyecto
en un hecho verificable. Y documentar cada decisión de modelo antes de migrar el esquema
permitió sobrevivir a un cambio de dominio a mitad de camino sin rehacer el análisis.

**Lo que no funcionó.**

El tablero se usó como backlog continuo y no con sprints cerrados, así que no hay
velocidad comparable entre iteraciones ni burndown. Las épicas no se movieron de estado a
medida que su alcance se completaba, de modo que el tablero subrepresenta el avance real.
Y la trazabilidad fina se reconstruyó al final en lugar de generarse al escribir el
código.

**Deuda técnica reconocida.**

Está documentada de forma explícita para no presentarla como si no existiera:

| Deuda | Dónde | Por qué no se pagó |
|---|---|---|
| `backend/src/routes/denuncias.js` concentra más de diez endpoints con la lógica de negocio en los propios manejadores; no hay capa de servicios ni de repositorios | `backend/src/routes/` | El refactor competía con los entregables de la rúbrica. La suite de pruebas cubre el comportamiento, así que el riesgo de regresión al refactorizar después es bajo. |
| Cuatro páginas de React superan las 300 líneas y solo existe un hook propio (`useMuroRealtime`) | `frontend/src/pages/` | La estructura modular declarada en `SCRUM-25` incluía carpetas `hooks/` y `services/` que nunca se crearon. |
| Sin pruebas end-to-end | — | La suite cubre lógica y contratos HTTP; el navegador y los archivos reales se validaron a mano. |
| Sin linter ni formateador configurados | — | No se priorizó. Es el arreglo más barato pendiente. |

---

## 4. Alcance planificado que no se entregó

Un sprint review honesto declara también lo que quedó fuera. Estos requisitos figuran en
las épicas del backlog y **no** están en el producto entregado:

| Requisito | Épica | Qué pasó |
|---|---|---|
| **RF-09** — marcado de resolución exclusivo por el autor | `SCRUM-21` | **Sustituido deliberadamente.** El modelo comunitario lo reemplazó: hacen falta tres ciudadanos distintos para que una denuncia pase a `resuelta`, y el autor no tiene poder especial. Dejar que el autor cerrara su propio caso contradecía el principio del proyecto. |
| **RF-11** — centro de notificaciones internas | `SCRUM-21` | **No implementado.** Exigía tabla de notificaciones, marcado de leídas y una bandeja en la interfaz. Se sacrificó para asegurar el despliegue. El muro en vivo con Realtime cubre parcialmente la necesidad de enterarse de un cambio. |
| **RF-07** — sección «Problema del día» | `SCRUM-20` | **No implementado como sección propia.** El orden «más apoyado» y «más grave» del muro cumple la función de destacar lo relevante. |
| **RF-13** — buscador avanzado por texto | `SCRUM-20` | **Parcial.** Están los filtros por zona, categoría y estado, y tres criterios de orden, pero no hay búsqueda por texto libre. |
| **RNF-06** — optimización de carga con code-splitting | `SCRUM-25` | **No implementado.** El bundle se sirve completo; a la escala del proyecto no se midió como problema. |
| Estructura modular con carpetas `hooks/` y `services/` | `SCRUM-25` | **Parcial.** Existen `lib/` y `components/`, pero la lógica de las pantallas no se extrajo a hooks ni a servicios. Es la deuda técnica de la sección anterior. |

---

## 5. Formato de historia de usuario

Plantilla usada en el backlog. El campo que decide si un ticket se puede cerrar son los
criterios de aceptación, no la descripción.

```text
Título:      <acción concreta y verificable>
Historia:    Como <rol>, quiero <capacidad> para <beneficio>.
Requisito:   RF-xx / RNF-xx  ·  Épica: SCRUM-xx  ·  Responsable: <único>

Criterios de aceptación
  [ ] <condición observable 1>
  [ ] <condición observable 2>
  [ ] Sin regresiones en el flujo relacionado.

Pasos para probar
  1. <cómo reproducirlo en la aplicación desplegada>
```

### Ejemplo real del backlog

Tomado de [`SCRUM-15`](https://codificandote.atlassian.net/browse/SCRUM-15) «Refrescar
estado tras acciones comunitarias», que dio origen a `useMuroRealtime.js`:

```text
Historia:   Como ciudadano, quiero ver el cambio de estado de una denuncia sin recargar
            la página, para saber al instante si mi voto tuvo efecto.

Criterios de aceptación
  [x] Al enviar un voto o una confirmación de resolución, la vista refresca los datos
      sin recargar el navegador.
  [x] Se escuchan eventos INSERT/UPDATE de valoraciones_progreso y aportes vía
      Supabase Realtime, y otros usuarios conectados ven el cambio.
  [x] La barra de progreso, el indicador de «cuánto falta» y el chip de estado se
      actualizan en cuanto la API confirma la transacción.

Pasos para probar
  1. Abrir el detalle de una denuncia.
  2. Emitir un voto de progreso o confirmar resolución.
  3. Verificar que contadores y chip cambian solos, sin recargar.
```

### Definition of Done

Un ticket pasa a **Finalizado** solo si cumple las cuatro condiciones (idéntica a la de
[`EQUIPO-Y-MODULOS.md`](EQUIPO-Y-MODULOS.md#definition-of-done)):

1. El código está mergeado en `main`.
2. El CI (`.github/workflows/ci.yml`) pasa en verde: pruebas de backend, de frontend y build.
3. El flujo se validó a mano en la aplicación desplegada.
4. La documentación afectada quedó actualizada.

---

## 6. Métricas y cómo verificarlas

Cifras del tablero al **12 de agosto de 2026**.

| Métrica | Valor |
|---|---|
| Tickets creados en el proyecto | 217 |
| Tickets finalizados | 183 |
| Tickets sin responsable asignado | 0 |
| Épicas | 8 |
| Primer ticket creado | 24 de junio de 2026 |

**Finalizados por integrante.** Suma exactamente 183.

| Integrante | Finalizados |
|---|---:|
| Axel Hernández | 59 |
| Adolfo Castro | 53 |
| Elkin Saltos | 34 |
| Johan Medranda | 19 |
| Marcelo Morales | 18 |

**Finalizados por iteración.** Suma exactamente 183.

| Iteración | Ventana | Finalizados |
|---|---|---:|
| 1 | 24 jun – 7 jul | 33 |
| 2 | 8 jul – 21 jul | 93 |
| 3 | 22 jul – 4 ago | 5 |
| 4 | 5 ago – 12 ago | 52 |

### Consultas JQL para reproducir cada cifra

```jql
-- Total de tickets del proyecto
project = SCRUM

-- Finalizados
project = SCRUM AND statusCategory = Done

-- Sin responsable (debe devolver 0)
project = SCRUM AND assignee IS EMPTY

-- Finalizados por integrante
project = SCRUM AND statusCategory = Done AND assignee = "Adolfo Castro"

-- Finalizados en una iteración
project = SCRUM AND resolutiondate >= "2026-07-08" AND resolutiondate < "2026-07-22"

-- Épicas y su estado
project = SCRUM AND issuetype = Epic ORDER BY key
```
