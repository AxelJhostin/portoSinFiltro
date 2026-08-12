# Equipo, módulos y gestión en Jira

Reparto de responsabilidades del equipo **PortoSinFiltro** y cómo se refleja en el tablero.
PUCE Sede Manabí · *Desarrollo de Sistemas de Información* 2026-1.

> **Fuente de verdad:** el tablero de Jira. Este documento es el resumen navegable, verificado
> contra el proyecto `SCRUM` de `codificandote.atlassian.net`. Sustituye a los antiguos
> `DIVISION-EQUIPO-JIRA.md` y `JIRA-DIVISION-TRABAJO.md`, que quedaron desactualizados y
> se contradecían entre sí.

**Tablero:** [Jira — portosinfiltro (`SCRUM`)](https://codificandote.atlassian.net/jira/software/projects/SCRUM/boards)

---

## 1. Integrantes y módulo del que son dueños

| Integrante | Módulo | Superficie de código | Rol en la sustentación |
|---|---|---|---|
| **Adolfo Castro** | Backend, panel público y despliegue | `backend/src/routes/`, `backend/src/db/`, `frontend/src/pages/PanelPublico.jsx`, `vercel.json` | Explica la API REST, el panel público y el despliegue en producción |
| **Axel Hernández** | Frontend del muro, features comunitarias y pruebas | `frontend/src/pages/Muro.jsx`, `DetalleDenuncia.jsx`, `components/ui/`, `backend/tests/`, `.github/workflows/` | Explica el muro, el tiempo real y la suite de pruebas con CI |
| **Elkin Saltos** | Base de datos, Supabase e infraestructura | `database/`, migraciones, Storage, PWA, mapa agregado | Explica el esquema, las vistas y cómo se calcula el estado en SQL |
| **Marcelo Morales** | Documentación, demo y QA de presentación | `README.md`, `docs/`, guion y ensayos de la demo | Conduce la demo y explica la metodología |
| **Johan Medranda** | QA manual, Plan B y guion | Checklists de prueba, `index.html` standalone, `database/seed.sql` | Explica el aseguramiento de calidad y el plan de contingencia |

**Regla de propiedad:** cualquiera puede ayudar en cualquier módulo, pero los bugs y los
tickets de una épica se asignan a su dueño. Cambios en archivos compartidos
(`frontend/src/lib/api.js`, `constants.js`, `App.jsx`) se avisan al equipo antes de editar.

---

## 2. Épicas del tablero y quién responde por cada una

> **Por qué esta tabla no coincide con la de arriba.** Son dos ejes distintos y ambos son
> correctos. La sección 1 reparte la **superficie de código**: quién mantiene qué archivos.
> Esta sección reparte la **responsabilidad de la épica en Jira**: quién responde por que
> el alcance se cierre. Se cruzan a propósito, para que nadie sea a la vez único autor y
> único revisor de un módulo. Ejemplo: Axel mantiene `Muro.jsx`, pero la épica
> `SCRUM-20` (Muro Público) responde Adolfo, que es dueño de los endpoints que la
> alimentan. Los responsables de abajo son los asignados reales de cada épica en el
> tablero.

| Épica | Alcance | Responsable |
|---|---|---|
| `SCRUM-18` Gestión de Usuarios y Autenticación | Registro, login, roles, RLS, perfiles | Axel |
| `SCRUM-19` Registro y Gestión de Denuncias | Formulario, fotos, ubicación, anonimato | Axel |
| `SCRUM-20` Muro Público | Feed, filtros, orden, apoyos, tiempo real | Adolfo |
| `SCRUM-21` Seguimiento Ciudadano | Votos de progreso, confirmación de resolución, estados | Adolfo |
| `SCRUM-22` Anonimato y Moderación | Reportes de falsas, ocultar/restaurar, gestión de usuarios | Johan |
| `SCRUM-23` Estadísticas Públicas | Panel público, KPIs, mapa agregado, paginación | Adolfo |
| `SCRUM-24` Aporte Colaborativo | Aportes, evidencia adicional, subida de foto en aportes | Johan |
| `SCRUM-25` Infraestructura y Configuración Técnica | Repositorio, entorno, migraciones, pruebas, CI, despliegue, documentación | Elkin |

---

## 3. Metodología aplicada

Scrum adaptado a sprints cortos. La justificación completa de por qué se eligió Scrum
frente a Kanban, cascada o XP está en
[`ARQUITECTURA.md` § 1](ARQUITECTURA.md#1-metodología-elección-y-justificación).

El **registro de las cuatro iteraciones** —objetivo, alcance entregado, sprint review y
retrospectiva de cada una, más el alcance que no se entregó— está en
[`SPRINTS.md`](SPRINTS.md).

### Flujo de estados

```
Por hacer  →  En progreso  →  En revisión  →  Finalizado
                                  ↑
                        PR abierto y CI en verde
```

### Definition of Done

Un ticket solo pasa a **Finalizado** cuando cumple las cuatro condiciones:

1. El código está mergeado en `main`.
2. El pipeline de CI (`.github/workflows/ci.yml`) pasa en verde: pruebas de backend, de frontend y build.
3. El flujo se validó a mano en la aplicación desplegada.
4. La documentación afectada quedó actualizada.

### Convenciones del tablero

| Convención | Regla |
|---|---|
| **Un dueño por ticket** | Nada queda sin asignar; el dueño de la épica absorbe lo que no tenga responsable claro. |
| **Todo ticket cuelga de una épica** | Ninguna tarea de primer nivel queda huérfana en el backlog. |
| **Subtareas** | Cada subtarea es una acción concreta y verificable dentro de una tarea. |
| **Dependencias** | Se declaran con el enlace `is blocked by` entre tickets de módulos distintos. |
| **Trazabilidad con Git** | Las tareas de código referencian el commit o el PR que las cierra. |

---

## 4. Dependencias entre módulos

```
Elkin — Base de datos y Supabase
        ↓
Adolfo — API backend
        ↓
Axel — Frontend ciudadano        Adolfo — Panel público y despliegue
        ↓                                ↓
        Marcelo y Johan — QA, documentación y demo
```

| Si trabajas en… | Necesitas listo… | De parte de… |
|---|---|---|
| API backend | Esquema y migraciones aplicadas | Elkin |
| Frontend ciudadano | Endpoints `/denuncias` y `/aportes` | Adolfo |
| Panel de moderación | Endpoints `/admin` y `/dashboard` | Adolfo |
| Despliegue | Variables de entorno y CORS | Elkin |
| Demo completa | Usuarios de prueba y datos semilla | Elkin |

---

## 5. Guion de la demo — reparto de la palabra

| Paso | Quién | Qué muestra |
|---|---|---|
| Apertura | Marcelo | Problema, propuesta y muro con filtros |
| Crear denuncia | Adolfo | Login ciudadano, mapa, foto, aparición en el muro |
| Participación | Adolfo | Apoyo, voto de progreso, indicador de "cuánto falta" |
| Reporte de falsa | Johan | Reportar con motivo y ver la cola del administrador |
| Moderación | Marcelo | `/admin`: KPIs, ocultar y restaurar |
| Estadísticas | Marcelo | `/panel-publico` y mapa agregado |
| Cierre comunitario | Adolfo + segunda cuenta | Tres confirmaciones y el chip pasa a RESUELTA en vivo |
| Fondo técnico BD | Elkin | El `CASE` de `vista_denuncias` que calcula el estado |
| Fondo técnico API | Axel | Verificación de JWT contra JWKS, roles y suite de pruebas |

**Plan B:** si Supabase o la red fallan, se abre `index.html` de la raíz, que es un
prototipo autónomo y funciona sin backend ni conexión.

---

## 6. Entregables de la rúbrica y dónde están

| Entregable | Ubicación |
|---|---|
| Script de creación de base de datos | [`database/BDD.sql`](../database/BDD.sql) |
| Diagramas UML y DER | [`docs/ARQUITECTURA.md`](ARQUITECTURA.md) |
| Artefactos ágiles: backlog, review y retrospectiva | [`docs/SPRINTS.md`](SPRINTS.md) |
| Diapositivas de sustentación | [`docs/presentacion/index.html`](presentacion/index.html) |
| Guía de despliegue y arquitectura | [`README.md`](../README.md) |
| Suite de pruebas | `backend/tests/`, `frontend/src/**/*.test.{js,jsx}` |
| Integración continua | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) |
| Tablero de gestión | [Jira `SCRUM`](https://codificandote.atlassian.net/jira/software/projects/SCRUM/boards) |
| Aplicación en producción | <https://porto-sin-filtro.vercel.app> |
