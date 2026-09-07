# Glosario de negocio y datos

Este es el punto de entrada para el vocabulario del MIS. Conserva los nombres del negocio, Winder/Ant, los motores de reporte, la jerarquia y los parametros de payload.

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
