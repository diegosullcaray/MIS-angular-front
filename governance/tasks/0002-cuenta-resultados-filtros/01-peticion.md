# MOD-0002 · Petición

**Fecha**: 2026-10-15 · **Solicita**: Diego Sullcaray · **Estado**: propuesto (script listo, sin ejecutar)

**Enfoque**: SP nuevo `rep.RTABCUERES01_NEW`; el original no se toca (convención de `modificaciones`).

## Pedido, tal como llegó

Observación en `observaciones.md` (2026-10-15), con la tabla esperada en
`image.png` y la reunión de revisión del 2026-10-07 en las
`notas de Gemini`:

> El código del reporte Cuenta de Resultados es TAB_CUE_RES_01. Lo ejecuta mod_rep.rep.RTABCUERES01 y recibe
> los parámetros fecha, tip_cod y cod_rel. Se requiere modificar el SP donde se quiere tener la tabla de la
> imagen, con los filtros adicionales. […] Dame el nuevo SP adicionando a los reportes los filtros
> correspondientes.

Información de la reunión que se usó:

| Dato | Valor |
|---|---|
| Tabla de datos | `mod_rep.dbo.WREPPYG001` |
| Cuentas (código → descripción) | `mod_rep.dbo.REVARPYG` |
| Niveles (`WCODREL`) | 1 FC · 3 asesor · 4 producto · 5 asesor y producto (las notas mencionan también un 2, sucursal) |
| Columnas | `WVALACT` mes actual · `WVALANT` mes anterior · `WVALAA` mismo mes del año anterior · `WACUMACT` acumulado actual · `WACUMAA` acumulado del año anterior |
| Producto | `RDESPROD` por `RETP002` → `RETP001` → `RETP003` (versión MIS) |

## Cómo se interpretó

| En el pedido | En el sistema |
|---|---|
| La tabla de la imagen | Ya es el diseño del front: *Actividad mensual › Rentabilidad › Cuenta de Resultados* (`cuenta-resultados.util.ts`, `crearColumnasCuentaResultados`): bloques *Flujo mensual* y *Acumulado*, columnas y semáforo iguales. **El front no necesita cambios** para mostrarla. |
| "Con los filtros adicionales" | El front ya manda `fecha` (periodo), `tip_cod` y `cod_rel` (nodo de la jerarquía), pero el SP actual los ignora: siempre devuelve junio 2026 a nivel FC. El SP nuevo los aplica y agrega **producto** como filtro opcional. |
| "Jun.26 vs Jun.25 %" | Con los números de la imagen es la variación del **acumulado** (Ingresos financieros: 37 351 / 289 299 = 12.91 %), no la del mes; el SP original la devuelve en 0. |

Queda fuera, porque en la reunión se dejó para definir: el detalle **a nivel de operación** (diálogo con
paginador).

## Qué se entrega

| Archivo | Para qué |
|---|---|
| [02-analisis.md](./02-analisis.md) | qué hace hoy el SP, qué cambia, supuestos a confirmar y qué falta en el front para el filtro de producto |
| [03-RTABCUERES01_NEW.create.sql](./03-RTABCUERES01_NEW.create.sql) | crea el SP nuevo |
| [04-verificacion.sql](./04-verificacion.sql) | supuestos (antes de crear), original y nuevo lado a lado, prueba de cada filtro |
| [05-rollback.sql](./05-rollback.sql) | volver al original y borrar el nuevo |
| [06-activacion.sql](./06-activacion.sql) | apuntar `TAB_CUE_RES_01` al nuevo en `RREGREP01` |
