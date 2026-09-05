# MIS · Base de datos del módulo de Accesos, Seguridad y Navegación

Diseño relacional desde cero para autenticación, RBAC dinámico y árbol de
navegación/reportes del sistema **MIS**.

| Archivo | Contenido |
|---|---|
| [`sql/01_ddl_seguridad.sql`](sql/01_ddl_seguridad.sql) | Extensiones, esquema `seg`, 11 tablas, restricciones e índices |
| [`sql/02_funciones_triggers.sql`](sql/02_funciones_triggers.sql) | Mantenimiento del path, guardas del árbol, funciones de autorización |
| [`sql/03_seed_demo.sql`](sql/03_seed_demo.sql) | Datos mínimos que ejercitan cada regla de resolución |
| [`sql/04_consultas_navegacion.sql`](sql/04_consultas_navegacion.sql) | CTE recursivas: árbol autorizado, guard, explicabilidad, breadcrumb |
| [`ARBOL_DE_ACCESOS_MIS.html`](ARBOL_DE_ACCESOS_MIS.html) | Documento de diseño completo, con diagramas. Se abre en el navegador |

Orden de ejecución: `01 → 02 → 03`. Motor objetivo **PostgreSQL 14+**
(la Consulta B de `04` es la variante portátil a Oracle / SQL Server / MySQL 8+).

> Los scripts **no se han ejecutado**: en esta máquina no hay `psql` ni Docker.
> Antes de aplicarlos en un entorno real, correrlos contra una base desechable.

---

## 1. Mapa de tablas

| # | Tabla | Rol en el modelo | PK | FK salientes |
|---|---|---|---|---|
| 1 | `seg.areas` | Unidad organizativa (auto-jerárquica) | `id` | `parent_id → areas` |
| 2 | `seg.positions` | Puesto de trabajo / cargo | `id` | `area_id`, `reports_to_id → positions` |
| 3 | `seg.users` | Identidad y credenciales | `id` | `position_id`, `created_by/updated_by → users` |
| 4 | `seg.user_position_history` | Histórico puesto↔usuario (append-only) | `id` | `user_id`, `position_id` |
| 5 | `seg.roles` | Catálogo de roles | `id` | `parent_role_id → roles` |
| 6 | **`seg.user_roles`** | **N:M usuario↔rol**, con vigencia | `(user_id, role_id)` | ambas |
| 7 | `seg.position_roles` | N:M puesto↔rol (roles automáticos por cargo) | `(position_id, role_id)` | ambas |
| 8 | **`seg.nodes`** | **Árbol de navegación y reportes** | `id` | `parent_id → nodes` |
| 9 | **`seg.node_permissions`** | **N:M rol↔nodo**, con herencia y ALLOW/DENY | `id` + UK `(role_id,node_id)` | `role_id`, `node_id` |
| 10 | `seg.user_sessions` | Sesiones / refresh tokens | `id` (UUID) | `user_id` |
| 11 | `seg.security_events` | Bitácora de seguridad | `id` | `user_id`, `node_id` |

Las tres tablas en negrita son el núcleo del requerimiento; el resto las sostiene.

---

## 2. Por qué Lista de Adyacencia **+** Materialized Path

La pregunta era adyacencia vs. conjuntos anidados. La respuesta es que ninguna
de las dos sola sirve, porque el árbol tiene dos perfiles de uso opuestos:

* **Escritura poco frecuente pero desordenada** — el administrador crea, renombra
  y sobre todo *mueve* carpetas de reportes.
* **Lectura constantísima** — cada login reconstruye el menú completo del usuario.

| Patrón | Leer subárbol | Mover nodo | Integridad |
|---|---|---|---|
| Lista de adyacencia pura | recursión en cada consulta | `UPDATE` de 1 fila | FK nativa |
| Conjuntos anidados (nested sets) | rango `lft/rgt`, muy rápido | **reescribe media tabla** | sin FK real |
| **Adyacencia + path derivado** | operador `<@` sobre índice GiST | 1 `UPDATE` + 1 sentencia para los descendientes | FK nativa |

Por eso `nodes` tiene **`parent_id` como única fuente de verdad** (con FK real,
`ON DELETE RESTRICT` y guarda anti-ciclo) y tres columnas **derivadas** que
ningún proceso escribe a mano — las calcula el trigger `trg_nodes_build_path`:

| Columna | Ejemplo | Para qué |
|---|---|---|
| `path` (`ltree`) | `4.17.92` | `n.path <@ o.path` = «n desciende de o», resuelto por índice GiST |
| `depth` | `2` | especificidad de una concesión (quién gana en un conflicto) |
| `sort_path` | `00010-…4.00020-…17` | ordena el árbol entero en preorden con **un solo `ORDER BY`** |

Mover una rama de 300 reportes cuesta un `UPDATE` de la fila movida más **una**
sentencia que reescribe los derivados de todos los descendientes
(`WHERE c.path <@ OLD.path`), sin recursión y sin tocar a ningún otro nodo del
árbol — el punto exacto donde los conjuntos anidados se caen.

### Comparación con el modelo actual de SSOWS

El backend heredado modela la navegación como cuatro tablas encadenadas:
`sistemas → secciones → subsecciones → modulos`, y `permisos` arrastra las cuatro
FK a la vez. Eso implica:

* **profundidad fija en 4**: un quinto nivel exige una tabla nueva, migrar
  `permisos` y tocar todos los servicios;
* **una fila de permiso por hoja**: la migración `insert-permisos-roles-2-12` tuvo
  que insertar una fila por módulo para expresar «el rol 2 ve todo menos la
  sección 22»;
* **JOIN de 4 tablas** en cada lectura de menú.

Con un árbol único, la profundidad es ilimitada, esa misma regla son **dos filas**
(`ALLOW SUBTREE` en la raíz + `DENY SUBTREE` en la sección excluida) y la lectura
es un solo `SELECT` ordenado.

### Continuidad con el backend Ant

El legacy ya devuelve el menú como lista de adyacencia en `list_sec`, así que la
migración es un mapeo directo de campos:

| Ant (`menu_response`) | `seg.nodes` |
|---|---|
| `cod_sec` | `code` |
| `cod_par` | `parent_id` (resuelto por `code`) |
| `desc_sec` | `name` |
| `act_sec` | `route` |
| `icon_sec` | `icon` |
| `order_sec` | `display_order` |

---

## 3. Herencia de permisos: explícita, no implícita

`node_permissions.applies_to` decide **por concesión** si el acceso baja o no:

* `SUBTREE` — el nodo y **todos** sus descendientes. Una fila cubre una carpeta
  entera, incluidos los reportes que se creen después.
* `NODE` — exactamente ese nodo. Sirve para dar un reporte suelto sin abrir la
  carpeta que lo contiene.

`grant_type` añade el `DENY` (negación completa; una restricción `CHECK` impide
un DENY con banderas en `TRUE`). Reglas de resolución, implementadas una sola vez
en `seg.fn_user_node_access` y reutilizadas por el menú y por el guard:

| | Regla |
|---|---|
| R1 | `SUBTREE` propaga hacia abajo; `NODE` no |
| R2 | Gana la concesión cuyo nodo de origen es **más profundo** (la excepción explícita vence a la regla general) |
| R3 | A igual profundidad, **DENY vence a ALLOW** |
| R4 | A igual profundidad, varios ALLOW **suman** sus banderas CRUD (`bool_or`): los roles nunca se restan entre sí |
| R5 | Un rol con `grants_full_access` ve el árbol completo |

Si la política corporativa exige el modelo ACL de Windows («un DENY en cualquier
nivel gana siempre»), la Consulta A' de `04` lo activa cambiando un solo CTE.

**Herencia hacia arriba (cierre ascendente).** Es la otra mitad, y es la que
obliga a la recursión: si un usuario solo tiene permiso sobre un reporte hoja,
las carpetas que lo contienen deben aparecer en el menú aunque no tengan
concesión propia. La Consulta A las trae con un `WITH RECURSIVE` que sube por
`parent_id` y las marca `access_source = 'CONTAINER'`, para que el frontend las
pinte como carpeta y nunca como destino navegable.

---

## 4. Lectura desde el backend

`GET /api/v1/navegacion/arbol` ejecuta la Consulta A y devuelve una lista
**plana ya ordenada** por `sort_path`. El servicio Node la convierte en JSON
anidado en una pasada O(n) agrupando por `parent_id` en un `Map` — el mismo
algoritmo que `MenuStgService` ya usa en `MIS-angular-front`, así que el
frontend no cambia de contrato.

Coste esperado con el volumen real del MIS (~240 reportes ⇒ ~400 nodos, ~30
roles, unos pocos miles de filas en `node_permissions`): índices en memoria y
respuesta de milisegundos. Recomendaciones operativas:

* Cachear el resultado por `user_id` con TTL corto (5 min), como ya hace
  `AuthorizationService` en SSOWS, e invalidar al cambiar roles o permisos.
* No materializar nada todavía. Una vista materializada `mv_user_node_access`
  solo se justifica por encima de ~5.000 nodos con ~10.000 usuarios.
* Autorizar **siempre** en el backend con `seg.fn_user_can`. El árbol que se
  envía al frontend es información de presentación, no un control de acceso.

---

## 5. Notas de diseño

* **Nomenclatura en inglés `snake_case`**, ruptura deliberada con el prefijo `t`
  del legacy (`tindiactiv`, `tfechcrea`, `tnombsist`). Si se necesita convivencia,
  se resuelve con vistas de compatibilidad, no replicando la convención.
* **Sin IDs negativos para roles de sistema.** SSOWS usa `SSO_SUPERADMIN = -1`
  para no chocar con el autoincremento; aquí lo cubren `is_system` y
  `grants_full_access`.
* **Puesto vigente + histórico.** `users.position_id` es el puesto actual (una
  sola unión en las consultas calientes) y `user_position_history` guarda la
  traza completa, poblada por trigger. Un índice único parcial garantiza un solo
  período abierto por usuario.
* **`position_roles` es lo que hace el alta barata**: el empleado nuevo hereda los
  roles de su cargo sin que nadie toque permisos.
* **Vigencias temporales** en `user_roles.valid_until` y
  `node_permissions.valid_until`: coberturas de vacaciones y accesos de auditoría
  que caducan solos, sin depender de que alguien recuerde revocarlos.
* **Contraseñas**: el hash (argon2id) lo calcula la aplicación, nunca el motor —
  así la contraseña no aparece jamás en el log de sentencias.
* **Borrado lógico** en `users.deleted_at`: preserva la integridad de la
  bitácora de seguridad.
