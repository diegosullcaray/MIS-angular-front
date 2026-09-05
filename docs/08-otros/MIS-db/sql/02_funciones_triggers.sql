-- =============================================================================
-- MIS · Módulo de Accesos, Seguridad y Navegación
-- Archivo   : 02_funciones_triggers.sql
-- Contenido : Mantenimiento automático del Materialized Path, guardas de
--             integridad del árbol y funciones de autorización reutilizables.
-- Requisito : ejecutar después de 01_ddl_seguridad.sql
-- =============================================================================

SET search_path = seg, public;

-- -----------------------------------------------------------------------------
-- 1. updated_at genérico
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION seg.fn_touch_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $fn$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$fn$;

CREATE TRIGGER trg_areas_touch     BEFORE UPDATE ON seg.areas     FOR EACH ROW EXECUTE FUNCTION seg.fn_touch_updated_at();
CREATE TRIGGER trg_positions_touch BEFORE UPDATE ON seg.positions FOR EACH ROW EXECUTE FUNCTION seg.fn_touch_updated_at();
CREATE TRIGGER trg_users_touch     BEFORE UPDATE ON seg.users     FOR EACH ROW EXECUTE FUNCTION seg.fn_touch_updated_at();
CREATE TRIGGER trg_roles_touch     BEFORE UPDATE ON seg.roles     FOR EACH ROW EXECUTE FUNCTION seg.fn_touch_updated_at();
CREATE TRIGGER trg_nodes_touch     BEFORE UPDATE ON seg.nodes     FOR EACH ROW EXECUTE FUNCTION seg.fn_touch_updated_at();


-- -----------------------------------------------------------------------------
-- 2. Árbol de nodos: cálculo de path / depth / sort_path + guardas
--
--    Se ejecuta BEFORE INSERT/UPDATE. En PostgreSQL los DEFAULT (incluida la
--    columna IDENTITY) ya están resueltos cuando corre un trigger BEFORE INSERT,
--    por lo que NEW.id está disponible para construir el path.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION seg.fn_nodes_build_path() RETURNS trigger
LANGUAGE plpgsql AS $fn$
DECLARE
    v_parent seg.nodes%ROWTYPE;
    v_key    TEXT;
BEGIN
    -- Clave de ordenamiento local: orden declarado + id como desempate estable.
    v_key := lpad(NEW.display_order::text, 5, '0') || '-' || lpad(NEW.id::text, 12, '0');

    IF NEW.parent_id IS NULL THEN
        NEW.path      := text2ltree(NEW.id::text);
        NEW.depth     := 0;
        NEW.sort_path := v_key;
        RETURN NEW;
    END IF;

    SELECT * INTO v_parent FROM seg.nodes WHERE id = NEW.parent_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'El nodo padre % no existe', NEW.parent_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    -- Guarda anti-ciclo: un nodo no puede colgar de uno de sus propios descendientes.
    IF NEW.id = ANY (string_to_array(v_parent.path::text, '.')::bigint[]) THEN
        RAISE EXCEPTION 'Ciclo detectado: el nodo % no puede colgar de % (que es su descendiente)',
            NEW.id, NEW.parent_id USING ERRCODE = 'check_violation';
    END IF;

    -- Guarda de tipos: solo los contenedores admiten hijos estructurales;
    -- las ACTION (permisos finos) cuelgan de un REPORT o de una PAGE.
    IF NEW.node_type = 'ACTION' THEN
        IF v_parent.node_type NOT IN ('REPORT','PAGE') THEN
            RAISE EXCEPTION 'Una ACTION solo puede colgar de un REPORT o PAGE (padre % es %)',
                v_parent.code, v_parent.node_type USING ERRCODE = 'check_violation';
        END IF;
    ELSIF v_parent.node_type NOT IN ('SYSTEM','FOLDER') THEN
        RAISE EXCEPTION 'Un nodo % solo puede colgar de SYSTEM o FOLDER (padre % es %)',
            NEW.node_type, v_parent.code, v_parent.node_type USING ERRCODE = 'check_violation';
    END IF;

    NEW.path      := v_parent.path || NEW.id::text;
    NEW.depth     := (v_parent.depth + 1)::smallint;
    NEW.sort_path := v_parent.sort_path || '.' || v_key;

    RETURN NEW;
END;
$fn$;

CREATE TRIGGER trg_nodes_build_path
    BEFORE INSERT OR UPDATE OF parent_id, display_order
    ON seg.nodes
    FOR EACH ROW EXECUTE FUNCTION seg.fn_nodes_build_path();


-- -----------------------------------------------------------------------------
-- 3. Reubicación de subárbol: al mover o reordenar un nodo se reescriben los
--    derivados de TODOS sus descendientes en UNA sola sentencia (sin recursión).
--
--    No hay recursión infinita: el UPDATE de descendientes toca únicamente
--    path/depth/sort_path, columnas que no disparan ninguno de los dos triggers
--    (ambos están acotados con UPDATE OF parent_id, display_order).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION seg.fn_nodes_move_subtree() RETURNS trigger
LANGUAGE plpgsql AS $fn$
BEGIN
    IF NEW.path IS DISTINCT FROM OLD.path OR NEW.sort_path IS DISTINCT FROM OLD.sort_path THEN
        UPDATE seg.nodes c
           SET path      = NEW.path || subpath(c.path, nlevel(OLD.path)),
               depth     = (NEW.depth + nlevel(c.path) - nlevel(OLD.path))::smallint,
               sort_path = NEW.sort_path || substr(c.sort_path, length(OLD.sort_path) + 1)
         WHERE c.path <@ OLD.path
           AND c.id <> NEW.id;
    END IF;
    RETURN NULL;
END;
$fn$;

CREATE TRIGGER trg_nodes_move_subtree
    AFTER UPDATE OF parent_id, display_order
    ON seg.nodes
    FOR EACH ROW EXECUTE FUNCTION seg.fn_nodes_move_subtree();


-- -----------------------------------------------------------------------------
-- 4. Histórico de puestos: se alimenta solo, desde users.position_id
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION seg.fn_users_track_position() RETURNS trigger
LANGUAGE plpgsql AS $fn$
BEGIN
    IF NEW.position_id IS NULL THEN
        RETURN NULL;
    END IF;

    UPDATE seg.user_position_history
       SET valid_to = now()
     WHERE user_id = NEW.id AND valid_to IS NULL;

    INSERT INTO seg.user_position_history (user_id, position_id, changed_by)
    VALUES (NEW.id, NEW.position_id, NEW.updated_by);

    RETURN NULL;
END;
$fn$;

CREATE TRIGGER trg_users_track_position
    AFTER INSERT OR UPDATE OF position_id
    ON seg.users
    FOR EACH ROW EXECUTE FUNCTION seg.fn_users_track_position();


-- =============================================================================
-- 5. FUNCIONES DE AUTORIZACIÓN
--    Encapsulan las reglas de resolución para que el menú (navegación) y el
--    guard del backend (autorización puntual) NUNCA puedan divergir.
-- =============================================================================

-- 5.1 Roles efectivos = asignados directamente + heredados del puesto vigente
CREATE OR REPLACE FUNCTION seg.fn_user_effective_roles(p_user_id BIGINT)
RETURNS TABLE (role_id INTEGER, source VARCHAR(10))
LANGUAGE sql STABLE AS $fn$
    SELECT ur.role_id, 'DIRECT'::VARCHAR(10)
      FROM seg.user_roles ur
      JOIN seg.roles r ON r.id = ur.role_id AND r.is_active
     WHERE ur.user_id = p_user_id
       AND ur.is_active
       AND ur.valid_from <= now()
       AND (ur.valid_until IS NULL OR ur.valid_until > now())
    UNION
    SELECT pr.role_id, 'POSITION'::VARCHAR(10)
      FROM seg.users u
      JOIN seg.position_roles pr ON pr.position_id = u.position_id AND pr.is_active
      JOIN seg.roles r           ON r.id = pr.role_id AND r.is_active
     WHERE u.id = p_user_id
       AND u.status = 'ACTIVE'
       AND u.deleted_at IS NULL;
$fn$;
COMMENT ON FUNCTION seg.fn_user_effective_roles(BIGINT) IS 'Un rol puede aparecer dos veces con distinto origen; es intencional (permite explicar en la UI por qué el usuario tiene ese rol).';


-- 5.2 Permisos resueltos por nodo, con herencia y precedencia ya aplicadas.
--
--     REGLAS DE PRECEDENCIA
--       R1. applies_to='SUBTREE' alcanza al nodo y a todos sus descendientes;
--           'NODE' se queda exactamente en el nodo.
--       R2. Gana SIEMPRE la concesión cuyo nodo de origen es MÁS PROFUNDO
--           (más específica): una excepción explícita vence a la regla general.
--       R3. A igual profundidad, DENY vence a ALLOW.
--       R4. A igual profundidad y varios ALLOW (usuario con varios roles), las
--           banderas CRUD se UNEN (bool_or): los roles suman, no restan.
--       R5. Un rol con grants_full_access ve todo el árbol.
CREATE OR REPLACE FUNCTION seg.fn_user_node_access(p_user_id BIGINT)
RETURNS TABLE (
    node_id    BIGINT,
    can_view   BOOLEAN,
    can_create BOOLEAN,
    can_update BOOLEAN,
    can_delete BOOLEAN,
    can_export BOOLEAN
)
LANGUAGE sql STABLE AS $fn$
    WITH roles_efectivos AS (
        SELECT DISTINCT f.role_id FROM seg.fn_user_effective_roles(p_user_id) f
    ),
    concesiones AS (
        SELECT np.node_id AS origen_id, np.grant_type, np.applies_to,
               np.can_view, np.can_create, np.can_update, np.can_delete, np.can_export
          FROM seg.node_permissions np
         WHERE np.role_id IN (SELECT role_id FROM roles_efectivos)
           AND np.is_active
           AND (np.valid_until IS NULL OR np.valid_until > now())
        UNION ALL
        -- R5: bypass del superadministrador (una concesión SUBTREE por cada raíz)
        SELECT n.id, 'ALLOW', 'SUBTREE', TRUE, TRUE, TRUE, TRUE, TRUE
          FROM seg.nodes n
         WHERE n.parent_id IS NULL
           AND EXISTS (SELECT 1 FROM roles_efectivos re
                         JOIN seg.roles r ON r.id = re.role_id
                        WHERE r.grants_full_access)
    ),
    -- R1: propagación de la herencia mediante el índice GiST sobre path
    alcance AS (
        SELECT n.id AS node_id, o.depth AS especificidad, c.grant_type,
               c.can_view, c.can_create, c.can_update, c.can_delete, c.can_export
          FROM concesiones c
          JOIN seg.nodes o ON o.id = c.origen_id
          JOIN seg.nodes n ON (c.applies_to = 'SUBTREE' AND n.path <@ o.path)
                           OR (c.applies_to = 'NODE'    AND n.id   =  o.id)
         WHERE n.is_active
    ),
    -- R2: se conserva únicamente el nivel de especificidad más profundo
    ganadoras AS (
        SELECT a.*, MAX(a.especificidad) OVER (PARTITION BY a.node_id) AS nivel_ganador
          FROM alcance a
    )
    -- R3 + R4
    SELECT g.node_id,
           bool_or(g.can_view)   AS can_view,
           bool_or(g.can_create) AS can_create,
           bool_or(g.can_update) AS can_update,
           bool_or(g.can_delete) AS can_delete,
           bool_or(g.can_export) AS can_export
      FROM ganadoras g
     WHERE g.especificidad = g.nivel_ganador
     GROUP BY g.node_id
    HAVING NOT bool_or(g.grant_type = 'DENY');
$fn$;


-- 5.3 Verificación puntual para el middleware/guard del backend.
CREATE OR REPLACE FUNCTION seg.fn_user_can(
    p_user_id   BIGINT,
    p_node_code VARCHAR,
    p_action    VARCHAR DEFAULT 'VIEW'
) RETURNS BOOLEAN
LANGUAGE sql STABLE AS $fn$
    SELECT COALESCE(
        (SELECT CASE upper(p_action)
                    WHEN 'VIEW'   THEN a.can_view
                    WHEN 'CREATE' THEN a.can_create
                    WHEN 'UPDATE' THEN a.can_update
                    WHEN 'DELETE' THEN a.can_delete
                    WHEN 'EXPORT' THEN a.can_export
                END
           FROM seg.fn_user_node_access(p_user_id) a
           JOIN seg.nodes n ON n.id = a.node_id
          WHERE n.code = p_node_code
            AND n.is_active),
        FALSE);
$fn$;
COMMENT ON FUNCTION seg.fn_user_can(BIGINT, VARCHAR, VARCHAR) IS 'Usar desde el guard de Express: SELECT seg.fn_user_can($1,$2,$3). Devuelve FALSE por defecto (deny by default).';
