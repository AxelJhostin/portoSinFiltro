# Arquitectura y modelado — PortoSinFiltro

Documento técnico de arquitectura del proyecto **PortoSinFiltro — El Muro de la Vergüenza**.
PUCE Sede Manabí · Ingeniería de Software · *Desarrollo de Sistemas de Información* 2026-1.

Todos los diagramas están en **Mermaid**, que GitHub renderiza directamente en esta
página. El script de creación de la base de datos es [`database/BDD.sql`](../database/BDD.sql).

> 🖼️ **Para verlos fuera de GitHub** (imprimir, exportar a PDF o abrir en un editor sin
> soporte de Mermaid), generar los diagramas como imágenes vectoriales:
>
> ```bash
> npm run diagramas
> ```
>
> Deja en `docs/diagramas/` un `ARQUITECTURA.md` con los ocho diagramas como archivos
> `.svg` enlazados. Requiere Node y descarga `@mermaid-js/mermaid-cli` con `npx` la
> primera vez.

## Índice

1. [Metodología: elección y justificación](#1-metodología-elección-y-justificación)
2. [Diagrama de casos de uso (UML)](#2-diagrama-de-casos-de-uso-uml)
3. [Diagrama de componentes y despliegue (UML)](#3-diagrama-de-componentes-y-despliegue-uml)
4. [Diagrama de clases (UML)](#4-diagrama-de-clases-uml)
5. [Diagramas de secuencia (UML)](#5-diagramas-de-secuencia-uml)
6. [Diagrama de estados (UML)](#6-diagrama-de-estados-uml)
7. [Modelo relacional completo (DER / MR)](#7-modelo-relacional-completo-der--mr)
8. [Trazabilidad de artefactos](#8-trazabilidad-de-artefactos)

---

## 1. Metodología: elección y justificación

El equipo trabajó con **Scrum adaptado a sprints cortos de dos semanas**.

### Por qué Scrum y no otra alternativa

| Alternativa | Por qué se descartó |
|---|---|
| **Kanban** | Es flujo continuo sin compromiso por iteración. Nuestro alcance estaba fijado de antemano por la rúbrica y la fecha de examen era inamovible, así que necesitábamos una meta cerrada y demostrable por sprint, no un flujo abierto. |
| **Cascada** | Exige requisitos congelados al inicio. Los nuestros cambiaron de raíz a mitad del proyecto: pasamos de un modelo donde el municipio cerraba las denuncias a uno donde el estado lo calcula la comunidad. Cascada habría obligado a rehacer el análisis completo. |
| **XP** | Sus prácticas centrales (programación en pareja continua, TDD estricto) no eran viables con cinco integrantes en horarios distintos y sin poder trabajar de forma sincrónica. |

### Cómo se aplicó

| Artefacto Scrum | Implementación concreta |
|---|---|
| **Product Backlog** | Proyecto `SCRUM` en Jira, priorizado por dependencia técnica: base de datos antes que API, API antes que interfaz. |
| **Épicas** | Una por módulo del sistema: autenticación y usuarios, registro de denuncias, muro público, seguimiento ciudadano, anonimato y moderación, estadísticas, infraestructura. |
| **Sprint Backlog** | Tickets con responsable único y criterios de aceptación verificables. |
| **Flujo de estados** | `Por hacer` → `En progreso` → `En revisión` (PR abierto y CI en verde) → `Finalizado`. |
| **Definition of Done** | Mergeado en `main`, CI en verde, y flujo validado en la aplicación desplegada. |
| **Dependencias** | Enlaces `is blocked by` entre tickets de módulos distintos. |

**Roles.** Sin Scrum Master dedicado por el tamaño del equipo: la facilitación fue rotativa
y la propiedad del backlog compartida. Cada integrante es dueño de un módulo y responsable
de los tickets de su épica.

**El registro de las iteraciones está en [`SPRINTS.md`](SPRINTS.md):** product backlog con
los requisitos `RF`/`RNF` por épica, y para cada una de las cuatro iteraciones su objetivo,
lo entregado, el sprint review y la retrospectiva. Incluye también el alcance planificado
que **no** se entregó y por qué, y las consultas JQL para verificar cada cifra contra el
tablero.

**Tablero:** [Jira — portosinfiltro (`SCRUM`)](https://codificandote.atlassian.net/jira/software/projects/SCRUM/boards)
· reparto vigente de módulos en [`EQUIPO-Y-MODULOS.md`](EQUIPO-Y-MODULOS.md).

---

## 2. Diagrama de casos de uso (UML)

Actores en rectángulo, casos de uso en óvalo, frontera del sistema en el recuadro.

```mermaid
flowchart LR
    VIS["👤 Visitante"]
    CIU["👤 Ciudadano"]
    ADM["👤 Administrador"]

    subgraph SYS["Sistema PortoSinFiltro"]
        direction TB
        UC1(["Consultar muro público"])
        UC2(["Ver detalle de denuncia"])
        UC3(["Consultar estadísticas públicas"])
        UC4(["Registrarse e iniciar sesión"])
        UC5(["Crear denuncia con foto y ubicación"])
        UC6(["Apoyar denuncia"])
        UC7(["Votar si el caso progresa"])
        UC8(["Aportar evidencia o confirmar resolución"])
        UC9(["Reportar denuncia falsa"])
        UC10(["Consultar mis denuncias"])
        UC11(["Ocultar o restaurar denuncia"])
        UC12(["Revisar cola de reportes"])
        UC13(["Activar o desactivar usuarios"])
    end

    VIS --- UC1
    VIS --- UC2
    VIS --- UC3
    VIS --- UC4

    CIU --- UC5
    CIU --- UC6
    CIU --- UC7
    CIU --- UC8
    CIU --- UC9
    CIU --- UC10

    ADM --- UC11
    ADM --- UC12
    ADM --- UC13

    CIU -. hereda .-> VIS
    ADM -. hereda .-> VIS

    classDef actor fill:#1A1A1A,stroke:#1A1A1A,color:#F7F6F2,font-weight:bold
    classDef uc fill:#FFFFFF,stroke:#555555,color:#1A1A1A
    class VIS,CIU,ADM actor
    class UC1,UC2,UC3,UC4,UC5,UC6,UC7,UC8,UC9,UC10,UC11,UC12,UC13 uc
```

**Restricciones de autorización que impone el diagrama.** El administrador **no** hereda
los casos de uso del ciudadano: no puede crear denuncias ni votar, porque moderar y
participar son roles incompatibles. Y ningún actor tiene un caso de uso "cambiar estado
de la denuncia": ese estado es derivado, no editable (ver sección 6).

---

## 3. Diagrama de componentes y despliegue (UML)

```mermaid
flowchart TB
    subgraph CLIENTE["《nodo》 Navegador del ciudadano"]
        SPA["《componente》 SPA React 18 + Vite<br/>pages · components · lib/api.js<br/>Service Worker · PWA"]
    end

    subgraph VERCEL["《nodo》 Vercel — dominio público HTTPS"]
        STATIC["《artefacto》 Bundle estático<br/>frontend/dist"]
        API["《componente》 API REST Express<br/>app.js · routes · middleware"]
    end

    subgraph SUPA["《nodo》 Supabase Cloud"]
        AUTH["《componente》 Auth<br/>emisor JWT ES256 + JWKS"]
        PG[("《almacén》 PostgreSQL<br/>10 tablas · 2 vistas · RLS")]
        STORE[("《almacén》 Storage<br/>bucket denuncias")]
        RT["《componente》 Realtime<br/>canal de cambios"]
    end

    SPA -->|"HTTPS · signInWithPassword"| AUTH
    SPA -->|"HTTPS · fetch /api/* + Bearer JWT"| API
    SPA -.->|"WebSocket · suscripción al muro"| RT
    STATIC -.->|"sirve"| SPA

    API -->|"verifica firma contra JWKS"| AUTH
    API -->|"cliente service_role · SQL"| PG
    API -->|"upload y URL pública"| STORE
    RT -.->|"escucha WAL"| PG

    classDef node fill:#F7F6F2,stroke:#1A1A1A,stroke-width:2px,color:#1A1A1A
    classDef comp fill:#FFFFFF,stroke:#B83232,stroke-width:2px,color:#1A1A1A
    classDef store fill:#FBFAF7,stroke:#555555,stroke-dasharray:4 3,color:#1A1A1A
    class SPA,API,AUTH,RT,STATIC comp
    class PG,STORE store
```

### Decisiones de arquitectura

| Decisión | Motivo |
|---|---|
| **El frontend nunca escribe en la base de datos** | Toda mutación pasa por el backend, que verifica token y rol. Deja un único punto donde auditar la autorización. |
| **El backend usa la `service_role` key** | La `anon` key respeta RLS, lo que hace que un `INSERT` legítimo pueda fallar por una política. El backend aplica su propia autorización, explícita y testeable; RLS queda como segunda capa ante accesos directos a la base. |
| **Verificación por JWKS y no por secreto compartido** | Supabase firma con ES256 (asimétrico). El backend valida con la llave **pública**, así que no existe `JWT_SECRET` que se pueda filtrar, y la rotación de llaves es transparente. |
| **Realtime consumido directo por el frontend** | Es un canal de solo lectura sobre tablas ya públicas. Pasarlo por el backend habría exigido mantener WebSockets en funciones serverless sin ganar seguridad. |

---

## 4. Diagrama de clases (UML)

El backend es JavaScript modular con ES Modules, no orientado a objetos con clases
`class`. El diagrama modela cada **módulo** como una unidad con su interfaz pública,
que es la lectura equivalente en UML de un módulo funcional.

```mermaid
classDiagram
    direction TB

    class App {
        <<módulo Express>>
        +helmet() Middleware
        +cors(origenesPermitidos) Middleware
        +globalLimiter() Middleware
        +writeLimiter() Middleware
        +montarRutas() void
    }

    class AuthMiddleware {
        <<módulo>>
        -JWKS RemoteJWKSet
        -ISSUER string
        -verificarToken(token) Payload
        +requireAuth(req, res, next) void
        +optionalAuth(req, res, next) void
        +requireRol(roles) Middleware
    }

    class SupabaseClient {
        <<singleton>>
        -SUPABASE_URL string
        -SUPABASE_SERVICE_KEY string
        +from(tabla) QueryBuilder
        +storage StorageClient
    }

    class DenunciasRouter {
        <<router>>
        +listar(filtros, pagina) Denuncia[]
        +listarParaMapa() Denuncia[]
        +obtenerPorId(id, usuario) Denuncia
        +crear(datos, autor) Denuncia
        +alternarApoyo(id, usuario) Conteo
        +votarProgreso(id, usuario, progresando) Conteo
        +reportarFalsa(id, usuario, motivo) Reporte
        +ocultar(id, oculta) Denuncia
        +listarFotos(id) Foto[]
        +subirFoto(id, archivo, usuario) Foto
        -adjuntarFotosPortada(filas) Denuncia[]
        -adjuntarYaApoyo(filas, usuario) Denuncia[]
    }

    class AportesRouter {
        <<router>>
        +listar(denunciaId) Aporte[]
        +crear(denunciaId, datos, autor) Aporte
    }

    class AdminRouter {
        <<router>>
        +listarDenuncias(pagina) Denuncia[]
        +listarReportes(pagina) Reporte[]
        +listarUsuarios(pagina) Perfil[]
        +cambiarActivo(id, activo) Perfil
    }

    class DashboardRouter {
        <<router>>
        +estadisticasPublicas() Stats
        +estadisticasAdmin() Stats
        +getDashboardStats() Stats
        -contarEstadoComunitario(filas) Conteo
        -agrupar(filas, campo) Grupo[]
    }

    class Perfil {
        <<entidad>>
        +uuid id
        +string nombre
        +string rol
        +boolean activo
    }

    class Denuncia {
        <<entidad>>
        +int id
        +uuid autorId
        +boolean anonima
        +int categoriaId
        +int zonaId
        +string descripcion
        +int gravedad
        +float latitud
        +float longitud
        +string titular
        +boolean oculta
    }

    class VistaDenuncias {
        <<vista SQL derivada>>
        +string estado
        +int totalApoyos
        +int totalProgresoSi
        +int totalProgresoNo
        +int totalReportes
        +string fotoPortada
        +int diasSinResolver
        +calcularEstado() string
    }

    App --> AuthMiddleware : aplica
    App --> DenunciasRouter : monta
    App --> AportesRouter : monta
    App --> AdminRouter : monta
    App --> DashboardRouter : monta

    DenunciasRouter --> AuthMiddleware : protege rutas
    AportesRouter --> AuthMiddleware : protege rutas
    AdminRouter --> AuthMiddleware : protege rutas
    DashboardRouter --> AuthMiddleware : protege rutas

    DenunciasRouter --> SupabaseClient : consulta
    AportesRouter --> SupabaseClient : consulta
    AdminRouter --> SupabaseClient : consulta
    DashboardRouter --> SupabaseClient : consulta

    AuthMiddleware ..> Perfil : resuelve
    SupabaseClient ..> Denuncia : persiste
    VistaDenuncias ..> Denuncia : deriva de
    DenunciasRouter ..> VistaDenuncias : lee
```

### Correspondencia entre operaciones y endpoints REST

| Módulo | Operación | Endpoint | Autorización |
|---|---|---|---|
| `DenunciasRouter` | `listar` | `GET /denuncias` | pública |
| | `listarParaMapa` | `GET /denuncias/mapa` | pública |
| | `obtenerPorId` | `GET /denuncias/:id` | `optionalAuth` |
| | `crear` | `POST /denuncias` | `requireRol('ciudadano')` |
| | `alternarApoyo` | `POST /denuncias/:id/apoyo` | `requireAuth` |
| | `votarProgreso` | `POST /denuncias/:id/progreso` | `requireRol('ciudadano')` |
| | `reportarFalsa` | `POST /denuncias/:id/reporte` | `requireRol('ciudadano')` |
| | `ocultar` | `PATCH /denuncias/:id/ocultar` | `requireRol('administrador')` |
| | `listarFotos` | `GET /denuncias/:id/fotos` | pública |
| | `subirFoto` | `POST /denuncias/:id/foto` | `requireAuth` |
| `AportesRouter` | `listar` | `GET /denuncias/:id/aportes` | pública |
| | `crear` | `POST /denuncias/:id/aportes` | `requireAuth` |
| `AdminRouter` | `listarDenuncias` | `GET /admin/denuncias` | `requireRol('administrador')` |
| | `listarReportes` | `GET /admin/reportes` | `requireRol('administrador')` |
| | `listarUsuarios` | `GET /admin/usuarios` | `requireRol('administrador')` |
| | `cambiarActivo` | `PATCH /admin/usuarios/:id` | `requireRol('administrador')` |
| `DashboardRouter` | `estadisticasPublicas` | `GET /dashboard/public` | pública |
| | `estadisticasAdmin` | `GET /dashboard` | `requireRol('administrador')` |

### Capas del frontend

```mermaid
classDiagram
    direction LR

    class App_jsx {
        <<raíz>>
        +BrowserRouter
        -session Session
        -perfil Perfil
    }

    class Pages {
        <<capa de pantallas>>
        Muro
        DetalleDenuncia
        NuevaDenuncia
        MisDenuncias
        PanelPublico
        Mapa
        Admin
        Login
        NotFound
    }

    class Components {
        <<capa de presentación>>
        Layout
        DenunciaCard
        BarraGravedad
        MapaUbicacion
        MapaDenuncias
        Paginacion
    }

    class Lib {
        <<capa de servicios>>
        +api inyectaJWTEnCadaFetch
        +supabase clienteAnonParaAuth
        +constants CATEGORIAS_ZONAS_ESTADOS
        +estadoComunitario mensajesDeUmbral
        +useMuroRealtime suscripcionEnVivo
    }

    App_jsx --> Pages : enruta
    Pages --> Components : compone
    Pages --> Lib : consume
    Components --> Lib : consume
```

---

## 5. Diagramas de secuencia (UML)

### 5.1 Crear una denuncia con foto

```mermaid
sequenceDiagram
    autonumber
    actor C as Ciudadano
    participant FE as SPA React
    participant AU as Supabase Auth
    participant BE as API Express
    participant MW as requireAuth / requireRol
    participant DB as PostgreSQL
    participant ST as Storage

    C->>FE: completa el formulario, marca el mapa y elige foto
    FE->>FE: validarFoto — tipo MIME y tamaño máximo 5 MB
    FE->>AU: getSession
    AU-->>FE: access token JWT ES256
    FE->>BE: POST /api/denuncias + Bearer token
    BE->>MW: requireAuth
    MW->>AU: descarga JWKS y verifica firma
    AU-->>MW: payload válido con sub
    MW->>DB: SELECT perfil WHERE id = sub
    DB-->>MW: perfil con rol y activo
    MW->>MW: requireRol('ciudadano')
    MW-->>BE: req.user autorizado
    BE->>BE: express-validator sobre el cuerpo
    BE->>BE: genera el titular editorial
    BE->>DB: INSERT INTO denuncias
    DB-->>BE: denuncia con id
    BE-->>FE: 201 Created

    FE->>BE: POST /api/denuncias/:id/foto (multipart)
    BE->>ST: upload al bucket denuncias
    ST-->>BE: URL pública
    BE->>DB: INSERT INTO fotos_denuncia
    BE-->>FE: 201 con la URL
    FE-->>C: redirige al detalle con la foto visible

    Note over FE,BE: Si la subida de la foto falla, la denuncia ya está publicada:<br/>el flujo se degrada, no se pierde el reporte.
```

### 5.2 Confirmar resolución hasta que el estado cambia solo

```mermaid
sequenceDiagram
    autonumber
    actor C3 as Tercer ciudadano
    participant FE as SPA React
    participant BE as API Express
    participant DB as PostgreSQL
    participant V as vista_denuncias
    participant RT as Realtime
    actor OT as Otros navegadores abiertos

    C3->>FE: aporte tipo "resolucion"
    FE->>BE: POST /api/denuncias/:id/aportes + JWT
    BE->>BE: requireAuth y validación del cuerpo
    BE->>DB: INSERT INTO aportes (tipo='resolucion')
    Note over DB: El índice único parcial impide<br/>una segunda resolución del mismo autor
    DB-->>BE: aporte creado

    BE->>V: SELECT * FROM vista_denuncias WHERE id = :id
    V->>V: cuenta 3 resoluciones distintas
    V->>V: CASE resoluciones >= 3 THEN 'resuelta'
    V-->>BE: estado = 'resuelta'
    BE-->>FE: 201 con el estado recalculado
    FE-->>C3: el chip pasa a RESUELTA sin recargar

    DB-->>RT: cambio en la tabla aportes
    RT-->>OT: notificación del canal
    OT->>BE: refresca el muro
    BE-->>OT: la denuncia ya figura como RESUELTA
```

---

## 6. Diagrama de estados (UML)

Ciclo de vida de una denuncia. Ninguna transición la dispara un administrador:
todas son consecuencia de evidencia ciudadana acumulada.

```mermaid
stateDiagram-v2
    direction LR
    [*] --> ACTIVA : el ciudadano publica

    state "ACTIVA" as ACTIVA
    state "CON AVANCE" as AVANCE
    state "RESUELTA" as RESUELTA
    state "OCULTA" as OCULTA

    ACTIVA --> AVANCE : 2 o mas votos si, y mas si que no
    AVANCE --> ACTIVA : se retiran votos y cae del umbral
    ACTIVA --> RESUELTA : 3 resoluciones de autores distintos
    AVANCE --> RESUELTA : 3 resoluciones de autores distintos

    ACTIVA --> OCULTA : el admin oculta por reportes
    AVANCE --> OCULTA : el admin oculta
    RESUELTA --> OCULTA : el admin oculta
    OCULTA --> ACTIVA : el admin restaura y se reevalua

    RESUELTA --> [*] : caso cerrado

    note right of RESUELTA
        Prioridad: con 3 o más resoluciones
        el estado es RESUELTA aunque no
        haya votos de progreso.
    end note

    note right of OCULTA
        No es un estado almacenado: es la
        bandera denuncias.oculta, que excluye
        la fila de vista_denuncias. El estado
        comunitario se sigue calculando.
    end note
```

**Lectura clave para la defensa:** `ACTIVA`, `CON AVANCE` y `RESUELTA` **no existen como
dato**. Son el resultado de un `CASE` evaluado en cada lectura de `vista_denuncias`:

```sql
CASE
  WHEN resoluciones >= 3                              THEN 'resuelta'
  WHEN progreso_si >= 2 AND progreso_si > progreso_no  THEN 'con_avance'
  ELSE 'activa'
END AS estado
```

Consecuencia de diseño: es imposible que el estado quede desincronizado de la evidencia,
y es imposible falsear un cierre desde la aplicación. El costo asumido es recalcular en
cada lectura; a la escala del proyecto es despreciable y, con volumen, se resolvería con
una vista materializada refrescada por trigger.

---

## 7. Modelo relacional completo (DER / MR)

Diez tablas y dos vistas. Nueve tablas están en uso; `historial_estados` es una tabla de
legado que quedó del modelo anterior, en el que el municipio cambiaba el estado a mano, y
que el `BDD.sql` sigue creando para que el esquema sea reproducible tal como está
desplegado. Notación pie de cuervo: `||` uno obligatorio, `o{` cero o muchos.

```mermaid
erDiagram
    perfiles ||--o{ denuncias : "redacta"
    perfiles ||--o{ fotos_denuncia : "sube"
    perfiles ||--o{ aportes : "escribe"
    perfiles ||--o{ reacciones : "apoya"
    perfiles ||--o{ valoraciones_progreso : "vota"
    perfiles ||--o{ reportes_denuncia : "reporta"
    perfiles ||--o{ historial_estados : "registra"

    categorias ||--o{ denuncias : "clasifica"
    zonas ||--o{ denuncias : "localiza"

    denuncias ||--o{ fotos_denuncia : "evidencia"
    denuncias ||--o{ aportes : "recibe"
    denuncias ||--o{ reacciones : "acumula"
    denuncias ||--o{ valoraciones_progreso : "acumula"
    denuncias ||--o{ reportes_denuncia : "acumula"
    denuncias ||--o{ historial_estados : "traza"

    perfiles {
        uuid id PK "FK a auth.users, ON DELETE CASCADE"
        text nombre "NOT NULL"
        text rol "CHECK ciudadano o administrador"
        boolean activo "DEFAULT true"
        timestamptz created_at
    }

    categorias {
        serial id PK
        text slug UK "baches_vias, alumbrado, basura..."
        text nombre "NOT NULL"
    }

    zonas {
        serial id PK
        text nombre UK "10 barrios de Portoviejo"
    }

    denuncias {
        serial id PK
        uuid autor_id FK "NOT NULL, siempre se guarda"
        boolean anonima "DEFAULT false"
        integer categoria_id FK "NOT NULL"
        integer zona_id FK "NOT NULL"
        text descripcion "NOT NULL, 20 a 1000 caracteres"
        smallint gravedad "CHECK entre 1 y 5"
        double latitud "opcional, marcado en el mapa"
        double longitud "opcional"
        text titular "generado por el backend"
        text estado_legacy "columna histórica, no se usa"
        boolean oculta "DEFAULT false, moderación"
        timestamptz created_at
        timestamptz updated_at "trigger trg_denuncias_updated_at"
    }

    fotos_denuncia {
        serial id PK
        integer denuncia_id FK "ON DELETE CASCADE"
        text url "NOT NULL, pública en Storage"
        uuid subida_por FK "NOT NULL"
        timestamptz created_at "ASC define la foto de portada"
    }

    aportes {
        serial id PK
        integer denuncia_id FK "ON DELETE CASCADE"
        uuid autor_id FK "NOT NULL"
        boolean anonimo "DEFAULT false"
        text tipo "CHECK confirmacion, evidencia, detalle, relacionado, resolucion"
        text contenido
        text foto_url
        timestamptz created_at
    }

    reacciones {
        serial id PK
        integer denuncia_id FK "ON DELETE CASCADE"
        uuid usuario_id FK "NOT NULL"
        timestamptz created_at
    }

    valoraciones_progreso {
        serial id PK
        integer denuncia_id FK "ON DELETE CASCADE"
        uuid usuario_id FK "NOT NULL"
        boolean progresando "NOT NULL, true si progresa"
        timestamptz created_at
        timestamptz updated_at
    }

    reportes_denuncia {
        serial id PK
        integer denuncia_id FK "ON DELETE CASCADE"
        uuid usuario_id FK "NOT NULL"
        text motivo "CHECK longitud minima 10"
        timestamptz created_at
    }

    historial_estados {
        serial id PK
        integer denuncia_id FK "ON DELETE CASCADE"
        text estado_anterior
        text estado_nuevo "NOT NULL"
        uuid cambiado_por FK "NOT NULL"
        text respuesta
        timestamptz created_at
    }
```

### Restricciones de integridad que sostienen las reglas de negocio

| Regla de negocio | Restricción en el esquema |
|---|---|
| Un apoyo por persona y por denuncia | `UNIQUE (denuncia_id, usuario_id)` en `reacciones` |
| Un voto de progreso por persona y por denuncia | `UNIQUE (denuncia_id, usuario_id)` en `valoraciones_progreso` |
| Un reporte de falsedad por persona y por denuncia | `UNIQUE (denuncia_id, usuario_id)` en `reportes_denuncia` |
| Una sola confirmación de resolución por persona | Índice único **parcial** `aportes_una_resolucion_por_usuario` con `WHERE tipo = 'resolucion'` — permite varios aportes de otros tipos del mismo autor |
| El motivo de un reporte no puede ser vacío ni trivial | `CHECK (char_length(trim(motivo)) >= 10)` |
| La gravedad es una escala cerrada | `CHECK (gravedad BETWEEN 1 AND 5)` |
| Solo existen dos roles | `CHECK (rol IN ('ciudadano','administrador'))` |
| Borrar una denuncia no deja huérfanos | `ON DELETE CASCADE` en las seis tablas hijas |
| `updated_at` nunca se desactualiza | Trigger `trg_denuncias_updated_at` con `actualizar_updated_at()` |
| Todo usuario nuevo tiene perfil de ciudadano | Trigger `on_auth_user_created` sobre `auth.users` → `handle_new_user()` |

### Vistas derivadas

| Vista | Diferencia | Consumidores |
|---|---|---|
| `vista_denuncias` | Excluye `oculta = true`. Aplica anonimato: si `anonima`, devuelve `NULL` en `autor_id` y `'Ciudadano Anónimo'` en `autor_nombre`. Calcula `estado`, `total_apoyos`, `total_aportes`, `total_fotos`, `total_progreso_si`, `total_progreso_no`, `total_reportes`, `foto_portada` y `dias_sin_resolver`. | Muro, detalle, panel público, mapa |
| `vista_denuncias_admin` | Idéntica pero **incluye** las ocultas. | Cola de moderación `/admin` |

### Seguridad a nivel de fila

RLS está activo en ocho de las diez tablas. Quedan fuera `categorias` y `zonas`, que son
catálogos públicos de solo lectura sin datos de usuario. El backend usa la `service_role`
key y bypassa RLS por diseño, así que RLS funciona como **segunda capa** ante un acceso
directo a la base con la `anon` key.

| Política | Tabla | Para qué existe |
|---|---|---|
| `lectura_publica_denuncias` | `denuncias` | Lectura pública de las no ocultas (`oculta = false`) |
| `lectura_publica_aportes` | `aportes` | Lectura pública de los aportes |
| `usuarios_ven_su_perfil` | `perfiles` | Que el frontend lea el nombre y rol del usuario autenticado, y solo el suyo |
| `lectura_publica_reacciones` | `reacciones` | Realtime respeta RLS: sin `SELECT` público el muro en vivo no recibe eventos |
| `lectura_publica_valoraciones` | `valoraciones_progreso` | Ídem, para los votos de progreso |
| `lectura_publica_fotos` | `fotos_denuncia` | Ídem, para las fotos |

Las tres últimas existen porque **Realtime evalúa RLS antes de emitir un evento**: una
tabla sin `SELECT` público no notifica cambios aunque esté en la publicación. Es la razón
por la que el muro en vivo depende de policies y no solo de la suscripción.

---

## 8. Trazabilidad de artefactos

| Artefacto exigido | Ubicación |
|---|---|
| Script estructurado de creación de base de datos | [`database/BDD.sql`](../database/BDD.sql) |
| Migraciones incrementales | `database/migracion_*.sql` |
| Datos de prueba | [`database/seed.sql`](../database/seed.sql) |
| Diagrama de casos de uso (UML) | Sección 2 de este documento |
| Diagrama de componentes y despliegue (UML) | Sección 3 |
| Diagrama de clases (UML) | Sección 4 |
| Diagramas de secuencia (UML) | Sección 5 |
| Diagrama de estados (UML) | Sección 6 |
| Diagrama entidad-relación (DER / MR) | Sección 7 |
| Justificación de la metodología | Sección 1 |
| Artefactos ágiles: backlog, sprint review y retrospectiva | [`docs/SPRINTS.md`](SPRINTS.md) |
| Diapositivas de sustentación | [`docs/presentacion/index.html`](presentacion/index.html) |
| Suite de pruebas | `backend/tests/` y `frontend/src/**/*.test.{js,jsx}` |
| Integración continua | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) |
| Guía de despliegue | Sección *Deploy* del [`README.md`](../README.md) |
| Reparto de módulos y tablero | [`EQUIPO-Y-MODULOS.md`](EQUIPO-Y-MODULOS.md) |
