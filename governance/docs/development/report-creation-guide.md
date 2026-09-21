# Guia para crear un reporte

Esta es la ruta operativa para agregar un reporte nuevo sin volver a investigar toda la arquitectura.

## 1. Identificar el modulo

Primero ubica el dominio funcional y el submodulo de la ruta:

| Pregunta | Decision |
|---|---|
| Es reportería operativa/comercial? | `src/app/pages/modules/reportes/` |
| Es una pantalla de actividades o captura? | `pages/modules/actividades/` |
| Es una consulta de presupuesto? | `pages/modules/presupuesto/` |
| Es analitica, ESG, incentivos, ranking o herramientas? | Usa el modulo principal correspondiente |

En `reportes`, elige ademas el subdominio: Actividad Diaria, Actividad Mensual, Avance Comercial, Desarrollo Sostenible o Analista.

## 2. Identificar la jerarquia

Busca primero el nivel que el reporte necesita. No elijas por intuicion: copia el patron de un reporte del mismo dominio.

| Constante | Uso esperado |
|---|---|
| `PARAMS_HIER_FC` | Consulta a nivel Financiera/confianza |
| `PARAMS_HIER_MACRO` | Consulta por macro |
| `PARAMS_HIER_UNIDAD` | Consulta por unidad, zona o agencia segun contrato |
| `PARAMS_HIER_OFICINA` | Consulta por oficina |
| `PARAMS_HIER_SEGUROS_PASIVOS` | Consulta de seguros pasivos |

Las constantes viven en `src/app/pages/modules/reportes/models/jerarquia.model.ts` (y su equivalente en `presupuesto/models/`). No elijas por intuicion: copia la constante de un reporte del mismo dominio.

El selector entrega un `NodoConsulta` con `tip_cod` y `cod_rel`. Si el backend requiere el nodo completo, usa `regularPaginado` y conserva `lvl`, `lbl_hier` y demas campos.

### Patrón de navegación jerárquica por tabla

Cuando el legado resuelve la jerarquía mediante *drill-down* en una tabla, el
selector no debe quedar como filtro visible. Se conserva internamente para
resolver el nodo autorizado, sincronizar el cascada y obtener la ruta; la
interacción de la persona usuaria ocurre en la tabla y en el breadcrumb.

El patrón está aplicado en Cartera Agrícola · Cultivos, tanto diaria como
mensual:

| Elemento | Regla |
|---|---|
| Filtros visibles | Solo la fecha de corte. No exponer selectores de jerarquía duplicados. |
| Inicialización | `app-hier-selector` queda oculto, con `reintentarSinFecha`, y emite el nodo autorizado y su ruta. |
| Tabla | La descripción cambia de nivel; las métricas pueden conservar su acción de detalle. Declarar las claves en `columnasClicables`. |
| Breadcrumb | Va después de los KPI y antes de la tabla. Las migas anteriores vuelven a consultar ese nivel; la última se marca como nivel activo. |
| Fila activa | Pasar una regla a `destacarFila` para resaltar toda la fila cuyo `tip_cod` y `cod_rel` coinciden con el nodo actual. |
| Nodo hoja | No iniciar otra consulta si el legado lo trata como hoja; conservar la acción de detalle que corresponda. |

Usar `HierSelectorComponent.seleccionarNodo()` para sincronizar un salto hecho
desde la tabla antes de consultar. Si el nodo no está en la cascada devuelta por
el backend, mantener el fallback explícito: actualizar la ruta y consultar el
nodo sin alterar el contrato. Las referencias de implementación son
`src/app/pages/modules/reportes/components/actividad-diaria/components/Cartera/items/cartera-agricola-cultivos/cartera-agricola-cultivos.component.ts` y
`src/app/pages/modules/reportes/components/actividad-mensual/components/Cartera/items/cartera-agricola-cultivos/cartera-agricola-cultivos.component.ts`.

## 3. Elegir la estructura de datos

| Respuesta esperada | Motor | Modelo/UI |
|---|---|---|
| Tabla con encabezados agrupados | `regularData` | `TablaReporteResultado` + `app-tabla-reporte` |
| Tabla de columnas anidadas | `table.regular` | `TablaDinamicaResultado` + `app-tabla-dinamica` |
| KPIs y varias tablas | `regularData` en varios bloques | `ReporteBloquesBase`/`ReporteSimpleComponent` |
| Graficos | `graphicData` | `BloqueGrafico` + `app-grafico-mixto/pie` |
| Reporte legado sin alternativa | `reportData` | `deprecado`, solo compatibilidad |

## 4. Elegir la estrategia de consulta

- `regular()`: bloque normal, agrega `fec` si no se envia fecha.
- `regularExacto()`: el contrato exige parametros exactos y no quieres fecha automatica.
- `regularPaginado()`: el backend necesita `pagen` y nodo completo.
- `regularTolerante()`: un 500 del backend significa bloque vacio conocido.
- `regulares()`: varios bloques independientes en paralelo.
- `tablaRegularCon()`: tabla dinamica con parametros propios.
- `regularLento()`: bloque que excede los tiempos normales.
- `tablaRegular()`: tabla dinamica sobre el nodo.
- `graficos()`: bloques Highcharts ya mapeados.
- `periodos()`: opciones de filtro de periodo.
- `deprecado()`: solo compatibilidad legada.

La fecha de corte sale de `profile.curr_fec`; `BloqueReporteService` la expone como `fec()` (`YYYYMMDD`, la que se envia por defecto) y `fecha()` (formato largo).

No uses `catchError(() => tablaVacia)` en un service de pantalla: solo se debe absorber el error que `esBloqueVacio()` reconoce.

## 5. Estructura de archivos

```text
pages/modules/reportes/<submodulo>/
  constantes/<reporte>.constantes.ts
  models/<reporte>.model.ts
  utils/<reporte>.util.ts
  services/<reporte>.service.ts
  items/<reporte>/<reporte>.component.ts
  items/<reporte>/<reporte>.component.html
  items/<reporte>/<reporte>.component.spec.ts
  <submodulo>.routes.ts
```

En `reportes` las pantallas hoja van en `items/`. Fuera de ese modulo van en `components/` — ver [convenciones de nombres](../development/naming-conventions.md).

Para selector y tablas usa `app-reporte-simple`. El contenedor conserva el estado
de consulta y pasa `[error]` y `[cargando]`; el armazón muestra error persistente y
reintento reemitiendo una copia del nodo. `ReporteSimpleBase` cancela al cambiar
filtros/destruirse y limpia tabla/error antes de consultar. Las tablas por sí solas
solo resuelven carga, vacío y formato: no reciben errores de consulta.

`errorJerarquia` es un fallo del selector, no del reporte. No duplicar el vacío de
las tablas, pero sí modelar errores y cancelación en contenedores personalizados.
Declarar `style`/`ordenPresentacion` en el adaptador; no añadir heurísticas de negocio
a `shared/ui`. El adaptador regularData conserva la presentación existente en
`src/app/pages/modules/reportes/utils/presentacion-legada.util.ts`, aislada y probada.

## 6. Orden de implementacion

1. Completar la ficha en [report-spec-template](../templates/report-spec-template.md).
2. Registrar ruta legado, `cod_rep`, motor, host y parametros.
3. Elegir `PARAMS_HIER_*` y documentar fecha/formato.
4. Crear modelo de respuesta y estado vacio.
5. Implementar service usando `BloqueReporteService`.
6. Crear componente con selector de jerarquia, estado de carga, vacio y error.
7. Registrar la ruta lazy.
8. Agregar spec del mapeo, service/componente y E2E.
9. Actualizar inventario de modulos y contrato si cambia el borde backend.

## Criterio de terminado

Esta es la referencia canónica. La [skill](../../skills/mis-reportes-bloques/SKILL.md)
añade solo el procedimiento del agente, sin duplicar motores/jerarquías.

Backend, OAuth y Winder están congelados. El scaffold requiere `--cod-rep`, pero su
DTO y formato numérico siguen siendo ejemplos pendientes de adaptar; no son
evidencia de un contrato verificado. Pruebas según [riesgo](./quality-gates.md).

El reporte no esta terminado porque renderiza una tabla. Debe tener contrato trazable, jerarquia correcta, estados completos, pruebas, accesibilidad, ruta navegable y evidencia de que un error real no se confunde con una respuesta vacia.
