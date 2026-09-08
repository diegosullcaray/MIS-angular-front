# Glosario de negocio y datos

Vocabulario canónico del MIS: nombres del negocio, de Winder/Ant, de los motores de reporte, de la jerarquía y de los parámetros de payload.

Es el primero de los documentos de [gobierno del dato](./README.md): sin acuerdo sobre qué significa un término, el catálogo y los contratos describen cosas distintas con las mismas palabras.

## Terminos de gobierno

| Termino | Definicion operativa | Fuente o responsable |
|---|---|---|
| Dato de negocio | Valor que representa una operacion, indicador, cliente, cartera o estructura organizativa | Dominio MIS / backend Ant |
| Contrato de datos | Forma, nombres, tipos y reglas de una peticion o respuesta | Backend Ant y adaptadores Winder |
| Fecha de corte | Fecha oficial a la que corresponde la informacion | `profile.curr_fec` |
| Jerarquia organizativa | Arbol de unidades usado para delimitar consultas y permisos | `cod_jer`, `tip_cod`, `cod_rel` |
| Reporte | Consulta identificada por `cod_rep` y procesada por un motor de reporte | ModReportesService |
| Fuente de verdad | Sistema que puede crear o corregir un dato | Backend; el frontend solo transforma para presentar |
| Dato sensible | Identidad, sesion, autorizacion o informacion financiera que requiere controles reforzados | Seguridad y backend |

## Reglas

- No crear sinonimos para `cod_rep`, `tip_cod`, `cod_rel`, `fec` o `fecha` sin documentar el mapeo.
- No interpretar una tabla vacia como ausencia de error sin revisar el contrato del motor.
- Toda definicion nueva debe indicar responsable, fuente y consumidores.

## Términos del contrato que no se traducen

Se escriben tal cual los usa el backend, en código y en documentación:

| Término | Qué es |
|---|---|
| `cod_rep` | identificador de una consulta de reporte |
| `tip_cod`, `cod_rel` | nodo de jerarquía sobre el que se consulta |
| `cod_jer` | código del árbol de jerarquía |
| `fec` / `fecha` | fecha de corte, en formato compacto o largo según el motor |
| `pagen` | página, en consultas paginadas |
| `act_sec` | segmento de ruta heredado del menú legado |

Crear un sinónimo de cualquiera de estos exige registrar la equivalencia acá.

## Ver también

- [Catálogo de datos](./catalog.md) — qué `cod_rep` existen y en qué dominio
- [Contratos](./contracts/README.md) — la forma exacta del dato en el borde
- [Catálogo de dominios de negocio](../business/domain-catalog.md) — el alcance funcional de cada área
