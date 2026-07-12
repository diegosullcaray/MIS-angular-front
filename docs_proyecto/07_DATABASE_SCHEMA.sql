-- ============================================================================
-- 07 — DATABASE SCHEMA · MIS Host (PostgreSQL 16+)
-- Proyecto : MIS - Management Information System (Financiera Confianza)
-- Versión  : 1.0.0 (2026-07-12)
-- Uso      : Migración baseline de Flyway (db/migration/V1__baseline.sql)
--            Contrato documentado en 04_BACKEND_SCHEMA.md §5
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid()

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. IAM — Roles y Usuarios (módulo `accesos`)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE roles (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre         VARCHAR(80)  NOT NULL,
    slug           VARCHAR(60)  NOT NULL UNIQUE,          -- ej. 'admin-sistema' (inmutable)
    creado_en      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT chk_roles_slug CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

CREATE TABLE usuarios (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre         VARCHAR(120) NOT NULL,
    email          VARCHAR(160) NOT NULL UNIQUE,          -- se persiste en minúsculas
    password_hash  VARCHAR(72)  NOT NULL,                 -- BCrypt (nunca sale en DTOs)
    rol_id         UUID         NOT NULL REFERENCES roles (id) ON DELETE RESTRICT,
    activo         BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_usuarios_rol    ON usuarios (rol_id);
CREATE INDEX idx_usuarios_activo ON usuarios (activo);
-- Búsqueda del listado (GET /usuarios?q=): nombre o email, case-insensitive
CREATE INDEX idx_usuarios_busqueda ON usuarios
    USING gin ((lower(nombre) || ' ' || lower(email)) gin_trgm_ops);
-- Requiere: CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Sistemas registrados (módulo `sistemas`) — Remotes + jerarquía
--    Sistema → Secciones → Subsecciones → Módulos
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE sistemas (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre         VARCHAR(80)  NOT NULL,
    slug           VARCHAR(80)  NOT NULL UNIQUE,          -- = nombre del Remote en federation.manifest.json
    descripcion    VARCHAR(300) NOT NULL DEFAULT '',
    icono          VARCHAR(60)  NOT NULL DEFAULT 'pi pi-th-large',  -- clase PrimeIcons
    url            VARCHAR(300) NOT NULL DEFAULT '',      -- remoteEntry.json del MFE
    version        VARCHAR(20)  NOT NULL DEFAULT '1.0.0',
    estado         VARCHAR(15)  NOT NULL DEFAULT 'inactivo',
    creado_en      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT chk_sistemas_slug   CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    CONSTRAINT chk_sistemas_estado CHECK (estado IN ('activo', 'mantenimiento', 'inactivo'))
);

CREATE TABLE secciones (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sistema_id UUID         NOT NULL REFERENCES sistemas (id) ON DELETE CASCADE,
    nombre     VARCHAR(80)  NOT NULL,
    slug       VARCHAR(80)  NOT NULL,
    orden      SMALLINT     NOT NULL DEFAULT 0,

    CONSTRAINT uq_secciones_slug UNIQUE (sistema_id, slug)
);

CREATE TABLE subsecciones (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seccion_id UUID         NOT NULL REFERENCES secciones (id) ON DELETE CASCADE,
    nombre     VARCHAR(80)  NOT NULL,
    slug       VARCHAR(80)  NOT NULL,
    orden      SMALLINT     NOT NULL DEFAULT 0,

    CONSTRAINT uq_subsecciones_slug UNIQUE (seccion_id, slug)
);

CREATE TABLE modulos (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subseccion_id  UUID         NOT NULL REFERENCES subsecciones (id) ON DELETE CASCADE,
    nombre         VARCHAR(80)  NOT NULL,
    slug           VARCHAR(80)  NOT NULL,
    activo         BOOLEAN      NOT NULL DEFAULT TRUE,
    orden          SMALLINT     NOT NULL DEFAULT 0,

    CONSTRAINT uq_modulos_slug UNIQUE (subseccion_id, slug)
);

CREATE INDEX idx_secciones_sistema     ON secciones    (sistema_id);
CREATE INDEX idx_subsecciones_seccion  ON subsecciones (seccion_id);
CREATE INDEX idx_modulos_subseccion    ON modulos      (subseccion_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Asignaciones y permisos
-- ─────────────────────────────────────────────────────────────────────────────

-- Subsistemas habilitados por ROL (campo `subsistemas` del modelo Rol)
CREATE TABLE rol_sistema (
    rol_id     UUID NOT NULL REFERENCES roles    (id) ON DELETE CASCADE,
    sistema_id UUID NOT NULL REFERENCES sistemas (id) ON DELETE RESTRICT,

    PRIMARY KEY (rol_id, sistema_id)
);
-- ON DELETE RESTRICT en sistemas: soporta la regla "409 si el sistema está
-- asignado a algún rol" del DELETE /sistemas/{id}.

-- Subsistemas habilitados por USUARIO (campo `subsistemas` del modelo Usuario;
-- puede sobrescribir lo heredado del rol)
CREATE TABLE usuario_sistema (
    usuario_id UUID NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    sistema_id UUID NOT NULL REFERENCES sistemas (id) ON DELETE CASCADE,

    PRIMARY KEY (usuario_id, sistema_id)
);

-- Permisos a nivel de MÓDULO por rol (PermisoRolSistema se deriva agrupando
-- por el sistema al que pertenece cada módulo)
CREATE TABLE permiso_rol_modulo (
    rol_id    UUID NOT NULL REFERENCES roles   (id) ON DELETE CASCADE,
    modulo_id UUID NOT NULL REFERENCES modulos (id) ON DELETE CASCADE,

    PRIMARY KEY (rol_id, modulo_id)
);
-- ON DELETE CASCADE en modulos: al reemplazar la estructura
-- (PUT /sistemas/{id}/estructura) los permisos huérfanos se depuran solos.

CREATE INDEX idx_permiso_rol ON permiso_rol_modulo (rol_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. MFA — Desafíos OTP (módulo `auth`)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE auth_otp (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id  UUID        NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    codigo_hash VARCHAR(72) NOT NULL,                     -- hash del OTP de 6 dígitos
    expira_en   TIMESTAMPTZ NOT NULL,                     -- creado_en + 3 minutos
    intentos    SMALLINT    NOT NULL DEFAULT 0,           -- máx. 5 (luego se invalida)
    usado_en    TIMESTAMPTZ,                              -- NULL = pendiente (un solo uso)
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_otp_usuario_vigente ON auth_otp (usuario_id, expira_en)
    WHERE usado_en IS NULL;
-- Limpieza: job programado que borra desafíos con expira_en < now() - interval '1 day'.

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Trigger de auditoría (actualizado_en)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_touch_actualizado_en() RETURNS trigger AS $$
BEGIN
    NEW.actualizado_en := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_roles_touch    BEFORE UPDATE ON roles    FOR EACH ROW EXECUTE FUNCTION fn_touch_actualizado_en();
CREATE TRIGGER trg_usuarios_touch BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION fn_touch_actualizado_en();
CREATE TRIGGER trg_sistemas_touch BEFORE UPDATE ON sistemas FOR EACH ROW EXECUTE FUNCTION fn_touch_actualizado_en();

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Seed mínimo (los 3 roles del PRD §4 + admin inicial)
--    En Flyway real: V2__seed.sql · La contraseña se define en el despliegue.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO roles (nombre, slug) VALUES
    ('Administrador del Sistema', 'admin-sistema'),
    ('Administrador General',     'admin-general'),
    ('Supervisor de Área',        'supervisor-area');

-- Usuario administrador inicial (hash BCrypt generado en el despliegue, NO en texto plano):
-- INSERT INTO usuarios (nombre, email, password_hash, rol_id)
-- SELECT 'Administrador MIS', 'admin@confianza.pe', '<bcrypt-hash>', id
--   FROM roles WHERE slug = 'admin-sistema';

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Vista de apoyo — resumen de sistemas (GET /api/v1/sistemas)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_sistemas_resumen AS
SELECT
    s.id,
    s.nombre,
    s.slug,
    s.descripcion,
    s.icono,
    s.version,
    s.estado,
    COUNT(DISTINCT sec.id)                                   AS total_secciones,
    COUNT(DISTINCT m.id)                                     AS total_modulos,
    (SELECT COUNT(*) FROM rol_sistema rs WHERE rs.sistema_id = s.id) AS roles_asignados,
    s.actualizado_en
FROM sistemas s
LEFT JOIN secciones     sec ON sec.sistema_id   = s.id
LEFT JOIN subsecciones  sub ON sub.seccion_id   = sec.id
LEFT JOIN modulos       m   ON m.subseccion_id  = sub.id
GROUP BY s.id;
