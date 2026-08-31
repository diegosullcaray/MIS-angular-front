-- =============================================================================
-- MIS · Módulo de Accesos, Seguridad y Navegación
-- Archivo   : 01_ddl_seguridad.sql
-- Motor     : PostgreSQL 14+
-- Esquema   : seg
-- Contenido : Extensiones, esquema, tablas, restricciones e índices.
-- -----------------------------------------------------------------------------
-- Decisiones de diseño (detalle en ../README.md):
--   1. Lista de Adyacencia (parent_id) como FUENTE DE VERDAD del árbol.
--   2. Materialized Path derivado (path/depth/sort_path) mantenido por trigger,
--      SOLO como acelerador de lectura. Nunca se escribe a mano.
--   3. Nomenclatura inglés snake_case (ruptura deliberada con el prefijo `t`
--      del legacy SSOWS: tindiactiv/tfechcrea).
--   4. Sin IDs negativos para roles de sistema (hack de SSOWS): bandera is_system.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS ltree;      -- árbol: operadores <@ @> e índice GiST
CREATE EXTENSION IF NOT EXISTS citext;     -- email case-insensitive
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()

CREATE SCHEMA IF NOT EXISTS seg;
COMMENT ON SCHEMA seg IS 'Accesos, seguridad y navegación del sistema MIS';

SET search_path = seg, public;


-- =============================================================================
-- BLOQUE 1 · ORGANIZACIÓN: ÁREAS Y PUESTOS
-- =============================================================================

CREATE TABLE seg.areas (
    id            INTEGER      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code          VARCHAR(30)  NOT NULL,
    name          VARCHAR(120) NOT NULL,
    parent_id     INTEGER      REFERENCES seg.areas(id) ON DELETE RESTRICT,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT areas_code_uk        UNIQUE (code),
    CONSTRAINT areas_no_self_parent CHECK  (parent_id IS DISTINCT FROM id)
);
COMMENT ON TABLE seg.areas IS 'Unidad organizativa (gerencia / division / agencia).';


CREATE TABLE seg.positions (
    id              INTEGER      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code            VARCHAR(30)  NOT NULL,          -- equivale a usuarios.tcodipues (SSOWS)
    name            VARCHAR(150) NOT NULL,          -- equivale a usuarios.tdescpues (SSOWS)
    description     VARCHAR(400),
    area_id         INTEGER      REFERENCES seg.areas(id)     ON DELETE RESTRICT,
    reports_to_id   INTEGER      REFERENCES seg.positions(id) ON DELETE SET NULL,
    hierarchy_level SMALLINT     NOT NULL DEFAULT 300,        -- menor = mas poder
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT positions_code_uk        UNIQUE (code),
    CONSTRAINT positions_level_chk      CHECK  (hierarchy_level BETWEEN 0 AND 999),
    CONSTRAINT positions_no_self_report CHECK  (reports_to_id IS DISTINCT FROM id)
);
COMMENT ON TABLE  seg.positions                 IS 'Puesto de trabajo / cargo. Normaliza lo que SSOWS guardaba desnormalizado en usuarios.tcodipues + tdescpues.';
COMMENT ON COLUMN seg.positions.hierarchy_level IS 'Escala heredada de ROLES_HIERARCHY: 0=superadmin, 100=jefatura, 300=empleado, 500=basico.';

CREATE INDEX positions_area_idx ON seg.positions(area_id) WHERE is_active;


-- =============================================================================
-- BLOQUE 2 · USUARIOS (AUTENTICACIÓN)
-- =============================================================================

CREATE TABLE seg.users (
    id                   BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    employee_code        VARCHAR(20)  NOT NULL,     -- tcodipers del maestro de personal
    username             VARCHAR(60)  NOT NULL,
    email                CITEXT       NOT NULL,
    document_number      VARCHAR(20),
    first_name           VARCHAR(80)  NOT NULL,
    last_name            VARCHAR(80)  NOT NULL,
    second_last_name     VARCHAR(80),

    -- Credenciales. El hash SIEMPRE se calcula en la aplicación (argon2id/bcrypt),
    -- nunca dentro del motor: evita que la contraseña viaje en el log de sentencias.
    password_hash        VARCHAR(255),              -- NULL = usuario solo federado (OAuth/SSO)
    password_algo        VARCHAR(20)  NOT NULL DEFAULT 'argon2id',
    password_updated_at  TIMESTAMPTZ,
    must_change_password BOOLEAN      NOT NULL DEFAULT FALSE,
    mfa_enabled          BOOLEAN      NOT NULL DEFAULT FALSE,

    status               VARCHAR(15)  NOT NULL DEFAULT 'PENDING',
    position_id          INTEGER      REFERENCES seg.positions(id) ON DELETE RESTRICT,

    failed_attempts      SMALLINT     NOT NULL DEFAULT 0,
    locked_until         TIMESTAMPTZ,
    last_login_at        TIMESTAMPTZ,

    created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    created_by           BIGINT       REFERENCES seg.users(id) ON DELETE SET NULL,
    updated_by           BIGINT       REFERENCES seg.users(id) ON DELETE SET NULL,
    deleted_at           TIMESTAMPTZ,               -- borrado lógico: preserva la traza de auditoría

    CONSTRAINT users_employee_code_uk UNIQUE (employee_code),
    CONSTRAINT users_username_uk      UNIQUE (username),
    CONSTRAINT users_email_uk         UNIQUE (email),
    CONSTRAINT users_status_chk       CHECK (status IN ('ACTIVE','INACTIVE','BLOCKED','SUSPENDED','PENDING')),
    CONSTRAINT users_algo_chk         CHECK (password_algo IN ('argon2id','bcrypt')),
    CONSTRAINT users_attempts_chk     CHECK (failed_attempts >= 0)
);
COMMENT ON COLUMN seg.users.position_id IS 'Puesto VIGENTE. El histórico completo vive en user_position_history (poblado por trigger).';

CREATE INDEX users_position_idx ON seg.users(position_id) WHERE deleted_at IS NULL;
CREATE INDEX users_status_idx   ON seg.users(status)      WHERE deleted_at IS NULL;


-- Histórico puesto <-> usuario. Append-only, alimentado por trigger desde users.position_id.
CREATE TABLE seg.user_position_history (
    id          BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES seg.users(id)     ON DELETE CASCADE,
    position_id INTEGER     NOT NULL REFERENCES seg.positions(id) ON DELETE RESTRICT,
    valid_from  TIMESTAMPTZ NOT NULL DEFAULT now(),
    valid_to    TIMESTAMPTZ,
    changed_by  BIGINT      REFERENCES seg.users(id) ON DELETE SET NULL,

    CONSTRAINT uph_range_chk CHECK (valid_to IS NULL OR valid_to > valid_from)
);
-- Un único puesto abierto (vigente) por usuario:
CREATE UNIQUE INDEX uph_one_open_per_user_uk ON seg.user_position_history(user_id) WHERE valid_to IS NULL;
CREATE INDEX uph_position_idx ON seg.user_position_history(position_id);


-- =============================================================================
-- BLOQUE 3 · ROLES Y ASIGNACIÓN N:M
-- =============================================================================

CREATE TABLE seg.roles (
    id                 INTEGER      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code               VARCHAR(40)  NOT NULL,
    name               VARCHAR(120) NOT NULL,
    description        VARCHAR(400),
    hierarchy_level    SMALLINT     NOT NULL DEFAULT 300,
    parent_role_id     INTEGER      REFERENCES seg.roles(id) ON DELETE SET NULL,
    grants_full_access BOOLEAN      NOT NULL DEFAULT FALSE,  -- bypass total (superadministrador)
    is_system          BOOLEAN      NOT NULL DEFAULT FALSE,  -- rol protegido: no borrable desde la UI
    is_active          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT roles_code_uk        UNIQUE (code),
    CONSTRAINT roles_level_chk      CHECK  (hierarchy_level BETWEEN 0 AND 999),
    CONSTRAINT roles_no_self_parent CHECK  (parent_role_id IS DISTINCT FROM id)
);
COMMENT ON COLUMN seg.roles.parent_role_id     IS 'Jerarquía de DELEGACIÓN (quién puede asignar a quién), NO herencia de permisos. La herencia vive exclusivamente en el árbol de nodos.';
COMMENT ON COLUMN seg.roles.grants_full_access IS 'TRUE solo para ADMIN_SISTEMA. Sustituye el hack de IDs negativos (SSO_SUPERADMIN = -1) del legacy SSOWS.';


-- N:M usuario <-> rol, con vigencia temporal (delegaciones, coberturas de vacaciones).
CREATE TABLE seg.user_roles (
    user_id     BIGINT      NOT NULL REFERENCES seg.users(id) ON DELETE CASCADE,
    role_id     INTEGER     NOT NULL REFERENCES seg.roles(id) ON DELETE CASCADE,
    valid_from  TIMESTAMPTZ NOT NULL DEFAULT now(),
    valid_until TIMESTAMPTZ,                                  -- NULL = indefinido
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
    granted_by  BIGINT      REFERENCES seg.users(id) ON DELETE SET NULL,
    granted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT user_roles_pk           PRIMARY KEY (user_id, role_id),
    CONSTRAINT user_roles_validity_chk CHECK (valid_until IS NULL OR valid_until > valid_from)
);
CREATE INDEX user_roles_role_idx ON seg.user_roles(role_id) WHERE is_active;


-- N:M puesto <-> rol: roles obtenidos AUTOMÁTICAMENTE por el cargo.
-- Es lo que hace que dar de alta a un empleado no requiera tocar permisos.
CREATE TABLE seg.position_roles (
    position_id INTEGER     NOT NULL REFERENCES seg.positions(id) ON DELETE CASCADE,
    role_id     INTEGER     NOT NULL REFERENCES seg.roles(id)     ON DELETE CASCADE,
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
    granted_by  BIGINT      REFERENCES seg.users(id) ON DELETE SET NULL,
    granted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT position_roles_pk PRIMARY KEY (position_id, role_id)
);
CREATE INDEX position_roles_role_idx ON seg.position_roles(role_id) WHERE is_active;


-- =============================================================================
-- BLOQUE 4 · ÁRBOL DE NAVEGACIÓN Y REPORTES
-- parent_id            -> fuente de verdad (Lista de Adyacencia)
-- path/depth/sort_path -> DERIVADOS por trigger (ver 02_funciones_triggers.sql)
-- =============================================================================

CREATE TABLE seg.nodes (
    id            BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    parent_id     BIGINT       REFERENCES seg.nodes(id) ON DELETE RESTRICT,
    code          VARCHAR(60)  NOT NULL,      -- equivalente a cod_sec del backend Ant
    name          VARCHAR(150) NOT NULL,      -- equivalente a desc_sec
    description   VARCHAR(400),
    node_type     VARCHAR(10)  NOT NULL,
    route         VARCHAR(250),               -- equivalente a act_sec (ruta Angular)
    icon          VARCHAR(60),                -- equivalente a icon_sec
    display_order SMALLINT     NOT NULL DEFAULT 100,  -- equivalente a order_sec
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE, -- FALSE = deshabilitado para todos
    is_visible    BOOLEAN      NOT NULL DEFAULT TRUE, -- FALSE = accesible por URL, oculto en el menú
    requires_mfa  BOOLEAN      NOT NULL DEFAULT FALSE,-- exige segundo factor vigente al entrar
    metadata      JSONB        NOT NULL DEFAULT '{}'::jsonb,

    -- ---- Columnas derivadas (NO escribir manualmente) -----------------------
    path          LTREE        NOT NULL,      -- '4.17.92'  (ids desde la raíz)
    depth          SMALLINT    NOT NULL,      -- 0 = raíz
    sort_path     TEXT         NOT NULL,      -- clave de orden preorden del menú
    -- ------------------------------------------------------------------------

    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    created_by    BIGINT       REFERENCES seg.users(id) ON DELETE SET NULL,
    updated_by    BIGINT       REFERENCES seg.users(id) ON DELETE SET NULL,

    CONSTRAINT nodes_code_uk        UNIQUE (code),
    CONSTRAINT nodes_no_self_parent CHECK (parent_id IS DISTINCT FROM id),
    CONSTRAINT nodes_type_chk       CHECK (node_type IN ('SYSTEM','FOLDER','REPORT','PAGE','ACTION','EXTERNAL')),

    -- Toda raíz es un SYSTEM y todo SYSTEM es raíz (columna 1 del sidebar del MIS).
    CONSTRAINT nodes_root_chk       CHECK ((parent_id IS NULL) = (node_type = 'SYSTEM')),

    -- Solo los nodos navegables tienen ruta; contenedores y acciones no.
    CONSTRAINT nodes_route_chk      CHECK (
        (node_type IN ('REPORT','PAGE','EXTERNAL') AND route IS NOT NULL) OR
        (node_type IN ('SYSTEM','FOLDER','ACTION') AND route IS NULL)
    ),
    CONSTRAINT nodes_order_chk      CHECK (display_order >= 0)
);
COMMENT ON TABLE  seg.nodes           IS 'Árbol único de navegación y reportes. Sustituye la jerarquía rígida de 4 niveles sistemas->secciones->subsecciones->modulos del legacy SSOWS.';
COMMENT ON COLUMN seg.nodes.node_type IS 'SYSTEM=raíz/subsistema · FOLDER=carpeta · REPORT=reporte final · PAGE=pantalla CRUD · ACTION=permiso fino (botón) · EXTERNAL=enlace externo.';
COMMENT ON COLUMN seg.nodes.path      IS 'Materialized path derivado (ltree). Acelera la lectura del subárbol; se recalcula por trigger.';
COMMENT ON COLUMN seg.nodes.sort_path IS 'Clave textual que ordena el árbol completo en preorden con un solo ORDER BY.';
COMMENT ON COLUMN seg.nodes.metadata  IS 'Parámetros del nodo, p.ej. {"powerbi_workspace":"...","export":["xlsx","pdf"],"remote":"kaypacha"}.';

CREATE UNIQUE INDEX nodes_route_uk        ON seg.nodes(route) WHERE route IS NOT NULL;
CREATE UNIQUE INDEX nodes_sibling_name_uk ON seg.nodes (COALESCE(parent_id, 0), lower(name));
CREATE        INDEX nodes_parent_idx      ON seg.nodes(parent_id);
CREATE        INDEX nodes_path_gist       ON seg.nodes USING GIST (path);   -- descendientes: path <@ ?
CREATE        INDEX nodes_path_btree      ON seg.nodes USING BTREE (path);  -- ancestros e igualdad
CREATE        INDEX nodes_sort_idx        ON seg.nodes(sort_path) WHERE is_active;
CREATE        INDEX nodes_type_idx        ON seg.nodes(node_type) WHERE is_active;


-- =============================================================================
-- BLOQUE 5 · PERMISOS ROL <-> NODO (N:M con herencia explícita)
-- =============================================================================

CREATE TABLE seg.node_permissions (
    id          BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    role_id     INTEGER     NOT NULL REFERENCES seg.roles(id) ON DELETE CASCADE,
    node_id     BIGINT      NOT NULL REFERENCES seg.nodes(id) ON DELETE CASCADE,

    grant_type  VARCHAR(5)  NOT NULL DEFAULT 'ALLOW',   -- ALLOW | DENY
    applies_to  VARCHAR(7)  NOT NULL DEFAULT 'SUBTREE', -- NODE = sin herencia · SUBTREE = con herencia

    can_view    BOOLEAN     NOT NULL DEFAULT TRUE,      -- equivale a tindileer
    can_create  BOOLEAN     NOT NULL DEFAULT FALSE,     -- equivale a tindicrea
    can_update  BOOLEAN     NOT NULL DEFAULT FALSE,     -- equivale a tindiactu
    can_delete  BOOLEAN     NOT NULL DEFAULT FALSE,     -- equivale a tindielim
    can_export  BOOLEAN     NOT NULL DEFAULT FALSE,     -- descarga XLSX/PDF del reporte

    is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
    valid_until TIMESTAMPTZ,                            -- acceso temporal a un reporte
    granted_by  BIGINT      REFERENCES seg.users(id) ON DELETE SET NULL,
    granted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT node_permissions_uk        UNIQUE (role_id, node_id),
    CONSTRAINT node_permissions_grant_chk CHECK (grant_type IN ('ALLOW','DENY')),
    CONSTRAINT node_permissions_scope_chk CHECK (applies_to IN ('NODE','SUBTREE')),
    -- Un DENY es una negación completa: no puede traer banderas en TRUE.
    CONSTRAINT node_permissions_deny_chk  CHECK (
        grant_type = 'ALLOW'
        OR NOT (can_view OR can_create OR can_update OR can_delete OR can_export)
    )
);
COMMENT ON TABLE  seg.node_permissions            IS 'Concesión N:M rol<->nodo. Una sola fila puede cubrir un subárbol completo (applies_to=SUBTREE).';
COMMENT ON COLUMN seg.node_permissions.applies_to IS 'NODE: el permiso NO se hereda a los hijos. SUBTREE: alcanza al nodo y a todos sus descendientes.';
COMMENT ON COLUMN seg.node_permissions.grant_type IS 'DENY permite el patrón "todo el sistema EXCEPTO la sección Seguridad" con 2 filas en lugar de N.';

CREATE INDEX node_permissions_role_idx ON seg.node_permissions(role_id) WHERE is_active;
CREATE INDEX node_permissions_node_idx ON seg.node_permissions(node_id) WHERE is_active;


-- =============================================================================
-- BLOQUE 6 · SESIONES Y AUDITORÍA
-- =============================================================================

CREATE TABLE seg.user_sessions (
    id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            BIGINT      NOT NULL REFERENCES seg.users(id) ON DELETE CASCADE,
    refresh_token_hash CHAR(64)    NOT NULL,       -- SHA-256 hex del token opaco (nunca el token)
    device_fingerprint VARCHAR(128),
    ip_address         INET,
    user_agent         TEXT,
    issued_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at         TIMESTAMPTZ NOT NULL,
    revoked_at         TIMESTAMPTZ,
    revoked_reason     VARCHAR(30),

    CONSTRAINT user_sessions_token_uk   UNIQUE (refresh_token_hash),
    CONSTRAINT user_sessions_expiry_chk CHECK (expires_at > issued_at),
    CONSTRAINT user_sessions_reason_chk CHECK (revoked_reason IS NULL OR revoked_reason IN
        ('LOGOUT','NEW_SESSION','ADMIN','EXPIRED','PASSWORD_CHANGE','SUSPICIOUS'))
);
CREATE INDEX user_sessions_user_idx    ON seg.user_sessions(user_id)    WHERE revoked_at IS NULL;
CREATE INDEX user_sessions_expires_idx ON seg.user_sessions(expires_at) WHERE revoked_at IS NULL;


CREATE TABLE seg.security_events (
    id          BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_code  VARCHAR(40) NOT NULL,   -- LOGIN_OK, LOGIN_FAIL, ACCESS_DENIED, PERMISSION_GRANTED...
    severity    VARCHAR(10) NOT NULL DEFAULT 'INFO',
    user_id     BIGINT      REFERENCES seg.users(id) ON DELETE SET NULL,
    node_id     BIGINT      REFERENCES seg.nodes(id) ON DELETE SET NULL,
    ip_address  INET,
    user_agent  TEXT,
    detail      JSONB       NOT NULL DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT security_events_sev_chk CHECK (severity IN ('INFO','WARN','ERROR','CRITICAL'))
);
COMMENT ON TABLE seg.security_events IS 'Bitácora de seguridad. Candidata natural a particionado RANGE mensual por occurred_at.';

CREATE INDEX security_events_user_idx ON seg.security_events(user_id, occurred_at DESC);
CREATE INDEX security_events_code_idx ON seg.security_events(event_code, occurred_at DESC);
CREATE INDEX security_events_node_idx ON seg.security_events(node_id, occurred_at DESC) WHERE node_id IS NOT NULL;
