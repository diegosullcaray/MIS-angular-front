-- =============================================================================
-- MIS · Módulo de Accesos, Seguridad y Navegación
-- Archivo   : 03_seed_demo.sql
-- Contenido : Juego de datos mínimo para validar las reglas de resolución.
--             Ningún INSERT fija IDs: todo se referencia por `code`.
-- Requisito : ejecutar después de 01 y 02.
-- =============================================================================

SET search_path = seg, public;
BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Áreas y puestos
-- ---------------------------------------------------------------------------
INSERT INTO seg.areas (code, name) VALUES
    ('TI',        'Tecnología de la Información'),
    ('COMERCIAL', 'División Comercial'),
    ('RIESGOS',   'División de Riesgos');

INSERT INTO seg.positions (code, name, area_id, hierarchy_level) VALUES
    ('ANALISTA_SIST',  'Analista de Sistemas',      (SELECT id FROM seg.areas WHERE code = 'TI'),        1),
    ('JEFE_COMERCIAL', 'Jefe Comercial de Agencia', (SELECT id FROM seg.areas WHERE code = 'COMERCIAL'), 100),
    ('ANALISTA_COM',   'Analista Comercial',        (SELECT id FROM seg.areas WHERE code = 'COMERCIAL'), 300);

UPDATE seg.positions
   SET reports_to_id = (SELECT id FROM seg.positions WHERE code = 'JEFE_COMERCIAL')
 WHERE code = 'ANALISTA_COM';


-- ---------------------------------------------------------------------------
-- 2. Roles
-- ---------------------------------------------------------------------------
INSERT INTO seg.roles (code, name, hierarchy_level, grants_full_access, is_system, description) VALUES
    ('ADMIN_SISTEMA',      'Administrador del Sistema',   0,   TRUE,  TRUE,  'Bypass total. Solo personal de TI.'),
    ('ADMIN_GENERAL',      'Administrador General',       100, FALSE, TRUE,  'Gestión funcional; sin acceso al editor del árbol.'),
    ('SUPERVISOR_AREA',    'Supervisor de Área',          200, FALSE, FALSE, 'Reportería comercial de su área.'),
    ('ANALISTA_COMERCIAL', 'Analista Comercial',          300, FALSE, FALSE, 'Consulta operativa diaria.'),
    ('CONSULTA',           'Consulta',                    500, FALSE, FALSE, 'Solo lectura, sin exportación.');

UPDATE seg.roles
   SET parent_role_id = (SELECT id FROM seg.roles WHERE code = 'SUPERVISOR_AREA')
 WHERE code = 'ANALISTA_COMERCIAL';


-- ---------------------------------------------------------------------------
-- 3. Roles derivados del puesto (alta de empleado sin tocar permisos)
-- ---------------------------------------------------------------------------
INSERT INTO seg.position_roles (position_id, role_id) VALUES
    ((SELECT id FROM seg.positions WHERE code = 'JEFE_COMERCIAL'), (SELECT id FROM seg.roles WHERE code = 'SUPERVISOR_AREA')),
    ((SELECT id FROM seg.positions WHERE code = 'ANALISTA_COM'),   (SELECT id FROM seg.roles WHERE code = 'ANALISTA_COMERCIAL')),
    ((SELECT id FROM seg.positions WHERE code = 'ANALISTA_SIST'),  (SELECT id FROM seg.roles WHERE code = 'ADMIN_SISTEMA'));


-- ---------------------------------------------------------------------------
-- 4. Usuarios
--    El hash es un placeholder: en producción lo genera la aplicación
--    (argon2id) y jamás se escribe literal en un script.
-- ---------------------------------------------------------------------------
INSERT INTO seg.users (employee_code, username, email, first_name, last_name,
                       password_hash, password_algo, status, position_id) VALUES
    ('000000001', 'dsalas',  'diego.salas@confianza.pe',  'Diego', 'Salas',
     '$argon2id$v=19$m=65536,t=3,p=4$PLACEHOLDER$PLACEHOLDER', 'argon2id', 'ACTIVE',
     (SELECT id FROM seg.positions WHERE code = 'ANALISTA_SIST')),

    ('000000002', 'mquispe', 'maria.quispe@confianza.pe', 'María', 'Quispe',
     '$argon2id$v=19$m=65536,t=3,p=4$PLACEHOLDER$PLACEHOLDER', 'argon2id', 'ACTIVE',
     (SELECT id FROM seg.positions WHERE code = 'JEFE_COMERCIAL')),

    ('000000003', 'lrojas',  'luis.rojas@confianza.pe',   'Luis',  'Rojas',
     '$argon2id$v=19$m=65536,t=3,p=4$PLACEHOLDER$PLACEHOLDER', 'argon2id', 'ACTIVE',
     (SELECT id FROM seg.positions WHERE code = 'ANALISTA_COM'));

-- Rol adicional otorgado a título individual y con vencimiento (cobertura temporal).
INSERT INTO seg.user_roles (user_id, role_id, valid_until) VALUES
    ((SELECT id FROM seg.users WHERE username = 'lrojas'),
     (SELECT id FROM seg.roles WHERE code = 'CONSULTA'),
     now() + INTERVAL '30 days');


-- ---------------------------------------------------------------------------
-- 5. Árbol de navegación
--    Nivel 0 (SYSTEM) = columna 1 del sidebar del MIS.
-- ---------------------------------------------------------------------------
INSERT INTO seg.nodes (parent_id, code, name, node_type, route, icon, display_order) VALUES
    (NULL, 'REPORTES',    'Reportes',    'SYSTEM', NULL, 'pi-chart-bar', 10),
    (NULL, 'ACTIVIDADES', 'Actividades', 'SYSTEM', NULL, 'pi-briefcase', 20),
    (NULL, 'SEGURIDAD',   'Seguridad',   'SYSTEM', NULL, 'pi-shield',    90);

-- Nivel 1
INSERT INTO seg.nodes (parent_id, code, name, node_type, route, display_order) VALUES
    ((SELECT id FROM seg.nodes WHERE code = 'REPORTES'),    'REP_COMERCIAL',       'Comercial',            'FOLDER', NULL,                              10),
    ((SELECT id FROM seg.nodes WHERE code = 'REPORTES'),    'REP_RIESGOS',         'Riesgos',              'FOLDER', NULL,                              20),
    ((SELECT id FROM seg.nodes WHERE code = 'ACTIVIDADES'), 'ACT_DESTINO_CREDITO', 'Destino de Crédito',   'PAGE',   '/app/actividades/destino-credito', 10),
    ((SELECT id FROM seg.nodes WHERE code = 'SEGURIDAD'),   'SEG_USUARIOS',        'Usuarios',             'PAGE',   '/app/seguridad/usuarios',          10),
    ((SELECT id FROM seg.nodes WHERE code = 'SEGURIDAD'),   'SEG_ROLES',           'Roles y Permisos',     'PAGE',   '/app/seguridad/roles',             20),
    ((SELECT id FROM seg.nodes WHERE code = 'SEGURIDAD'),   'SEG_NODOS',           'Editor del Árbol',     'PAGE',   '/app/seguridad/nodos',             30);

-- Nivel 2
INSERT INTO seg.nodes (parent_id, code, name, node_type, route, display_order, metadata) VALUES
    ((SELECT id FROM seg.nodes WHERE code = 'REP_COMERCIAL'), 'REP_COL_DIA', 'Colocaciones del Día', 'REPORT', '/app/reportes/colocaciones-dia', 10, '{"export":["xlsx","pdf"]}'::jsonb),
    ((SELECT id FROM seg.nodes WHERE code = 'REP_COMERCIAL'), 'REP_MORA',    'Mora de Cartera',      'REPORT', '/app/reportes/mora-cartera',     20, '{"export":["xlsx"]}'::jsonb),
    ((SELECT id FROM seg.nodes WHERE code = 'REP_RIESGOS'),   'REP_CARTERA', 'Cartera en Riesgo',    'REPORT', '/app/reportes/cartera-riesgo',   10, '{"export":["xlsx"]}'::jsonb);

-- Nivel 3: permiso fino sobre un botón del reporte
INSERT INTO seg.nodes (parent_id, code, name, node_type, route, display_order) VALUES
    ((SELECT id FROM seg.nodes WHERE code = 'REP_MORA'), 'ACT_MORA_DESCARGA', 'Descargar detalle', 'ACTION', NULL, 10);


-- ---------------------------------------------------------------------------
-- 6. Permisos rol <-> nodo
-- ---------------------------------------------------------------------------

-- ADMIN_SISTEMA no necesita filas: grants_full_access = TRUE.

-- ADMIN_GENERAL: todo el sistema EXCEPTO el editor del árbol.
-- Este es exactamente el caso "ROL 2: acceso completo salvo la sección
-- Seguridad" que en SSOWS obligaba a insertar una fila por módulo.
INSERT INTO seg.node_permissions (role_id, node_id, grant_type, applies_to, can_view, can_create, can_update, can_delete, can_export) VALUES
    ((SELECT id FROM seg.roles WHERE code = 'ADMIN_GENERAL'), (SELECT id FROM seg.nodes WHERE code = 'REPORTES'),    'ALLOW', 'SUBTREE', TRUE,  FALSE, FALSE, FALSE, TRUE),
    ((SELECT id FROM seg.roles WHERE code = 'ADMIN_GENERAL'), (SELECT id FROM seg.nodes WHERE code = 'ACTIVIDADES'), 'ALLOW', 'SUBTREE', TRUE,  TRUE,  TRUE,  TRUE,  TRUE),
    ((SELECT id FROM seg.roles WHERE code = 'ADMIN_GENERAL'), (SELECT id FROM seg.nodes WHERE code = 'SEGURIDAD'),   'ALLOW', 'SUBTREE', TRUE,  TRUE,  TRUE,  FALSE, FALSE),
    ((SELECT id FROM seg.roles WHERE code = 'ADMIN_GENERAL'), (SELECT id FROM seg.nodes WHERE code = 'SEG_NODOS'),   'DENY',  'SUBTREE', FALSE, FALSE, FALSE, FALSE, FALSE);

-- SUPERVISOR_AREA: toda la carpeta Comercial (con herencia) + UN reporte
-- suelto de Riesgos (sin herencia, applies_to = 'NODE').
INSERT INTO seg.node_permissions (role_id, node_id, grant_type, applies_to, can_view, can_export) VALUES
    ((SELECT id FROM seg.roles WHERE code = 'SUPERVISOR_AREA'), (SELECT id FROM seg.nodes WHERE code = 'REP_COMERCIAL'), 'ALLOW', 'SUBTREE', TRUE, TRUE),
    ((SELECT id FROM seg.roles WHERE code = 'SUPERVISOR_AREA'), (SELECT id FROM seg.nodes WHERE code = 'REP_CARTERA'),   'ALLOW', 'NODE',    TRUE, FALSE);

-- ANALISTA_COMERCIAL: un único reporte, sin herencia ni exportación.
INSERT INTO seg.node_permissions (role_id, node_id, grant_type, applies_to, can_view, can_export) VALUES
    ((SELECT id FROM seg.roles WHERE code = 'ANALISTA_COMERCIAL'), (SELECT id FROM seg.nodes WHERE code = 'REP_COL_DIA'), 'ALLOW', 'NODE', TRUE, FALSE);

COMMIT;


-- =============================================================================
-- VERIFICACIÓN RÁPIDA
-- =============================================================================

-- El árbol con sus derivados ya calculados por trigger:
--   SELECT repeat('    ', depth) || code AS arbol, node_type, path::text, depth
--     FROM seg.nodes ORDER BY sort_path;

-- Permisos resueltos de María (SUPERVISOR_AREA vía su puesto):
--   SELECT n.code, a.can_view, a.can_export
--     FROM seg.fn_user_node_access((SELECT id FROM seg.users WHERE username='mquispe')) a
--     JOIN seg.nodes n ON n.id = a.node_id
--    ORDER BY n.sort_path;
--
--   Esperado: REP_COMERCIAL, REP_COL_DIA, REP_MORA, ACT_MORA_DESCARGA (heredados
--   del SUBTREE) y REP_CARTERA (concesión NODE). NO aparece REP_RIESGOS.

-- Precedencia en acción (María: concesión SUBTREE en Comercial + NODE en un reporte):
--   WITH ag AS (SELECT id FROM seg.users WHERE username='mquispe')
--   SELECT seg.fn_user_can((SELECT id FROM ag), 'REP_CARTERA', 'VIEW')  AS ve_cartera,   -- t
--          seg.fn_user_can((SELECT id FROM ag), 'REP_CARTERA', 'EXPORT') AS exporta,      -- f (concesion NODE sin export)
--          seg.fn_user_can((SELECT id FROM ag), 'REP_RIESGOS', 'VIEW')  AS ve_carpeta;   -- f (solo contenedor del menu)
