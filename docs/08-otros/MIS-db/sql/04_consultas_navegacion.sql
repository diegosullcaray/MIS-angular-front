-- =============================================================================
-- MIS · Módulo de Accesos, Seguridad y Navegación
-- Archivo   : 04_consultas_navegacion.sql
-- Contenido : Consultas recursivas (CTE) de lectura del árbol autorizado.
-- Parámetro : $1 = users.id  (BIGINT)
-- =============================================================================


-- =============================================================================
-- CONSULTA A · ÁRBOL DE NAVEGACIÓN PERMITIDO PARA UN USUARIO   [la principal]
-- -----------------------------------------------------------------------------
-- Endpoint destino: GET /api/v1/navegacion/arbol
--
-- Resuelve en una sola ida a la base de datos:
--   1. roles efectivos    = directos + heredados del puesto
--   2. herencia hacia ABAJO  (applies_to = 'SUBTREE'), vía índice GiST sobre path
--   3. precedencia ALLOW/DENY por especificidad
--   4. cierre hacia ARRIBA (recursivo): un reporte visible arrastra a las
--      carpetas que lo contienen, aunque esas carpetas no tengan concesión
--      propia — sin esto el menú saldría desconectado.
--
-- Devuelve una lista PLANA ya ordenada en preorden (sort_path). El backend la
-- convierte en JSON anidado en una sola pasada O(n) con un Map por parent_id,
-- exactamente el algoritmo que ya usa MenuStgService en el front.
-- =============================================================================
WITH RECURSIVE
-- 1) Roles efectivos ---------------------------------------------------------
roles_efectivos AS (
    SELECT ur.role_id
      FROM seg.user_roles ur
      JOIN seg.roles r ON r.id = ur.role_id AND r.is_active
     WHERE ur.user_id = $1
       AND ur.is_active
       AND ur.valid_from <= now()
       AND (ur.valid_until IS NULL OR ur.valid_until > now())
    UNION
    SELECT pr.role_id
      FROM seg.users u
      JOIN seg.position_roles pr ON pr.position_id = u.position_id AND pr.is_active
      JOIN seg.roles r           ON r.id = pr.role_id AND r.is_active
     WHERE u.id = $1
       AND u.status = 'ACTIVE'
       AND u.deleted_at IS NULL
),

-- 2) Concesiones aplicables (+ bypass del superadministrador) -----------------
concesiones AS (
    SELECT np.node_id AS origen_id, np.grant_type, np.applies_to,
           np.can_view, np.can_create, np.can_update, np.can_delete, np.can_export
      FROM seg.node_permissions np
     WHERE np.role_id IN (SELECT role_id FROM roles_efectivos)
       AND np.is_active
       AND (np.valid_until IS NULL OR np.valid_until > now())
    UNION ALL
    SELECT n.id, 'ALLOW', 'SUBTREE', TRUE, TRUE, TRUE, TRUE, TRUE
      FROM seg.nodes n
     WHERE n.parent_id IS NULL
       AND EXISTS (SELECT 1 FROM roles_efectivos re
                     JOIN seg.roles r ON r.id = re.role_id
                    WHERE r.grants_full_access)
),

-- 3) Herencia hacia abajo ----------------------------------------------------
--    n.path <@ o.path  ->  "n es o o desciende de o"  (índice GiST)
alcance AS (
    SELECT n.id AS node_id, o.depth AS especificidad, c.grant_type,
           c.can_view, c.can_create, c.can_update, c.can_delete, c.can_export
      FROM concesiones c
      JOIN seg.nodes o ON o.id = c.origen_id
      JOIN seg.nodes n ON (c.applies_to = 'SUBTREE' AND n.path <@ o.path)
                       OR (c.applies_to = 'NODE'    AND n.id   =  o.id)
     WHERE n.is_active
),

-- 4) Precedencia: gana la concesión más específica; a igual nivel, DENY vence --
ganadoras AS (
    SELECT a.*, MAX(a.especificidad) OVER (PARTITION BY a.node_id) AS nivel_ganador
      FROM alcance a
),
resueltos AS (
    SELECT g.node_id,
           bool_or(g.grant_type = 'DENY') AS denegado,
           bool_or(g.can_view)   AS can_view,
           bool_or(g.can_create) AS can_create,
           bool_or(g.can_update) AS can_update,
           bool_or(g.can_delete) AS can_delete,
           bool_or(g.can_export) AS can_export
      FROM ganadoras g
     WHERE g.especificidad = g.nivel_ganador
     GROUP BY g.node_id
),
permitidos AS (
    SELECT * FROM resueltos WHERE NOT denegado AND can_view
),

-- 5) Cierre ascendente (RECURSIVO) -------------------------------------------
--    UNION (no UNION ALL) corta la recursión cuando varias ramas reconvergen
--    en un ancestro común: cada nodo se visita una sola vez.
arbol AS (
    SELECT n.id, n.parent_id
      FROM seg.nodes n
      JOIN permitidos p ON p.node_id = n.id
     WHERE n.node_type <> 'ACTION'      -- las ACTION son permisos, no ítems de menú
       AND n.is_visible
    UNION
    SELECT padre.id, padre.parent_id
      FROM seg.nodes padre
      JOIN arbol a ON a.parent_id = padre.id
     WHERE padre.is_active
       AND padre.is_visible
)

SELECT n.id,
       n.parent_id,
       n.code,
       n.name,
       n.node_type,
       n.route,
       n.icon,
       n.depth,
       n.display_order,
       n.metadata,
       n.requires_mfa,
       -- GRANTED  = el usuario tiene permiso sobre este nodo
       -- CONTAINER= solo aparece para dar continuidad al camino hacia un hijo permitido
       CASE WHEN p.node_id IS NULL THEN 'CONTAINER' ELSE 'GRANTED' END AS access_source,
       COALESCE(p.can_create, FALSE) AS can_create,
       COALESCE(p.can_update, FALSE) AS can_update,
       COALESCE(p.can_delete, FALSE) AS can_delete,
       COALESCE(p.can_export, FALSE) AS can_export
  FROM arbol a
  JOIN seg.nodes n       ON n.id = a.id
  LEFT JOIN permitidos p ON p.node_id = n.id
 ORDER BY n.sort_path;   -- preorden exacto del menú, sin ordenar en memoria


-- =============================================================================
-- CONSULTA A' · VARIANTE "DENY ABSOLUTO"
-- -----------------------------------------------------------------------------
-- Por defecto rige "gana lo más específico": un ALLOW más profundo puede abrir
-- una excepción dentro de una rama denegada. Si la política corporativa exige el
-- modelo tipo ACL de Windows ("un DENY en cualquier nivel gana siempre"),
-- basta reemplazar el CTE `permitidos` de la Consulta A por este:
--
--   permitidos AS (
--       SELECT r.*
--         FROM resueltos r
--        WHERE NOT r.denegado
--          AND r.can_view
--          AND NOT EXISTS (SELECT 1 FROM alcance d
--                           WHERE d.node_id = r.node_id
--                             AND d.grant_type = 'DENY')
--   )
--
-- Funciona porque `alcance` ya expandió los DENY de tipo SUBTREE a todos los
-- descendientes: si existe cualquier DENY que alcance al nodo, se descarta.
-- =============================================================================


-- =============================================================================
-- CONSULTA B · MISMA LÓGICA, 100% PORTÁTIL (sin ltree)
-- -----------------------------------------------------------------------------
-- Usa SOLO parent_id y la columna derivada `depth`, ambas expresables en Oracle,
-- SQL Server, MySQL 8+ y MariaDB 10.2+. Útil si el MIS debe convivir con el
-- Oracle del backend Ant. La herencia hacia abajo se propaga con un segundo
-- término recursivo en lugar del operador <@.
-- =============================================================================
WITH RECURSIVE
roles_efectivos AS (
    SELECT ur.role_id
      FROM seg.user_roles ur
      JOIN seg.roles r ON r.id = ur.role_id AND r.is_active
     WHERE ur.user_id = $1 AND ur.is_active
       AND ur.valid_from <= now()
       AND (ur.valid_until IS NULL OR ur.valid_until > now())
    UNION
    SELECT pr.role_id
      FROM seg.users u
      JOIN seg.position_roles pr ON pr.position_id = u.position_id AND pr.is_active
      JOIN seg.roles r           ON r.id = pr.role_id AND r.is_active
     WHERE u.id = $1 AND u.status = 'ACTIVE' AND u.deleted_at IS NULL
),
concesiones AS (
    SELECT np.node_id AS origen_id, n.depth AS especificidad,
           np.grant_type, np.applies_to,
           np.can_view, np.can_create, np.can_update, np.can_delete, np.can_export
      FROM seg.node_permissions np
      JOIN seg.nodes n ON n.id = np.node_id
     WHERE np.role_id IN (SELECT role_id FROM roles_efectivos)
       AND np.is_active
       AND (np.valid_until IS NULL OR np.valid_until > now())
),
-- Propagación descendente recursiva: sustituye a  n.path <@ o.path
alcance AS (
    SELECT c.origen_id AS node_id, c.especificidad, c.grant_type, c.applies_to,
           c.can_view, c.can_create, c.can_update, c.can_delete, c.can_export
      FROM concesiones c
    UNION ALL
    SELECT h.id, a.especificidad, a.grant_type, a.applies_to,
           a.can_view, a.can_create, a.can_update, a.can_delete, a.can_export
      FROM alcance a
      JOIN seg.nodes h ON h.parent_id = a.node_id
     WHERE a.applies_to = 'SUBTREE'
       AND h.is_active
),
ganadoras AS (
    SELECT a.*, MAX(a.especificidad) OVER (PARTITION BY a.node_id) AS nivel_ganador
      FROM alcance a
),
permitidos AS (
    SELECT g.node_id,
           bool_or(g.can_export) AS can_export
      FROM ganadoras g
     WHERE g.especificidad = g.nivel_ganador
     GROUP BY g.node_id
    HAVING NOT bool_or(g.grant_type = 'DENY')
       AND bool_or(g.can_view)
),
arbol AS (
    SELECT n.id, n.parent_id
      FROM seg.nodes n JOIN permitidos p ON p.node_id = n.id
     WHERE n.node_type <> 'ACTION' AND n.is_visible
    UNION
    SELECT padre.id, padre.parent_id
      FROM seg.nodes padre JOIN arbol a ON a.parent_id = padre.id
     WHERE padre.is_active AND padre.is_visible
)
SELECT n.id, n.parent_id, n.code, n.name, n.node_type, n.route, n.icon, n.depth,
       CASE WHEN p.node_id IS NULL THEN 'CONTAINER' ELSE 'GRANTED' END AS access_source
  FROM arbol a
  JOIN seg.nodes n       ON n.id = a.id
  LEFT JOIN permitidos p ON p.node_id = n.id
 ORDER BY n.sort_path;


-- =============================================================================
-- CONSULTA C · GUARD DEL BACKEND (autorización puntual)
-- -----------------------------------------------------------------------------
-- Un solo booleano por request. Va en el middleware, antes del controlador.
--   $1 = users.id · $2 = nodes.code · $3 = VIEW|CREATE|UPDATE|DELETE|EXPORT
-- =============================================================================
SELECT seg.fn_user_can($1, $2, $3) AS allowed;


-- =============================================================================
-- CONSULTA D · EXPLICABILIDAD ("¿por qué este usuario ve este reporte?")
-- -----------------------------------------------------------------------------
-- Imprescindible para auditoría interna y para el soporte funcional: devuelve
-- la cadena rol -> nodo de origen -> alcance que concede (o niega) el acceso.
-- =============================================================================
SELECT r.code                      AS rol,
       er.source                   AS origen_del_rol,   -- DIRECT | POSITION
       origen.code                 AS concedido_en,
       origen.depth                AS profundidad,
       np.grant_type,
       np.applies_to,
       np.can_view, np.can_export,
       np.granted_at
  FROM seg.fn_user_effective_roles($1) er
  JOIN seg.roles r            ON r.id = er.role_id
  JOIN seg.node_permissions np ON np.role_id = er.role_id AND np.is_active
  JOIN seg.nodes origen        ON origen.id = np.node_id
  JOIN seg.nodes destino       ON destino.code = $2
 WHERE (np.applies_to = 'SUBTREE' AND destino.path <@ origen.path)
    OR (np.applies_to = 'NODE'    AND destino.id   =  origen.id)
 ORDER BY origen.depth DESC, np.grant_type;   -- la primera fila es la que manda


-- =============================================================================
-- CONSULTA E · MIGAS DE PAN (ancestros de un nodo) — sin recursión
-- -----------------------------------------------------------------------------
-- El materialized path convierte el breadcrumb en un simple filtro indexado.
-- =============================================================================
SELECT a.id, a.code, a.name, a.route, a.depth
  FROM seg.nodes n
  JOIN seg.nodes a ON n.path <@ a.path
 WHERE n.code = $1
 ORDER BY a.depth;


-- =============================================================================
-- CONSULTA F · MATRIZ INVERSA: qué roles alcanzan un nodo
-- -----------------------------------------------------------------------------
-- Alimenta la pantalla de administración de permisos y la revisión periódica de
-- accesos (control SOX / ISO 27001: recertificación de privilegios).
-- =============================================================================
SELECT r.code AS rol,
       origen.code AS concedido_en,
       np.grant_type,
       np.applies_to,
       COUNT(u.id) AS usuarios_afectados
  FROM seg.nodes destino
  JOIN seg.nodes origen        ON destino.path <@ origen.path
  JOIN seg.node_permissions np ON np.node_id = origen.id AND np.is_active
                              AND (np.applies_to = 'SUBTREE' OR origen.id = destino.id)
  JOIN seg.roles r             ON r.id = np.role_id AND r.is_active
  LEFT JOIN seg.user_roles ur  ON ur.role_id = r.id AND ur.is_active
  LEFT JOIN seg.users u        ON u.id = ur.user_id AND u.status = 'ACTIVE'
 WHERE destino.code = $1
 GROUP BY r.code, origen.code, np.grant_type, np.applies_to
 ORDER BY np.grant_type, r.code;


-- =============================================================================
-- CONSULTA G · SUBÁRBOL COMPLETO DE UN NODO (administración del árbol)
-- -----------------------------------------------------------------------------
-- Sin recursión y con índice GiST: es la lectura que en el modelo de 4 niveles
-- de SSOWS exigía tres JOIN encadenados y no soportaba un quinto nivel.
-- =============================================================================
SELECT repeat('    ', (n.depth - raiz.depth)) || n.name AS arbol,
       n.code, n.node_type, n.route, n.is_active
  FROM seg.nodes raiz
  JOIN seg.nodes n ON n.path <@ raiz.path
 WHERE raiz.code = $1
 ORDER BY n.sort_path;
