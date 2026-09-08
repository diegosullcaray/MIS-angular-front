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

Para el caso habitual (selector de jerarquia arriba, tablas abajo) usa `app-reporte-simple` de `reportes/ui/reporte-simple/`: ya resuelve carga, vacio, error y el selector, asi que no envuelvas la pantalla en tu propio estado vacio.

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

La guia operativa completa, con ejemplos, esta en [`skills/mis-reportes-bloques`](../../skills/mis-reportes-bloques/SKILL.md).

El reporte no esta terminado porque renderiza una tabla. Debe tener contrato trazable, jerarquia correcta, estados completos, pruebas, accesibilidad, ruta navegable y evidencia de que un error real no se confunde con una respuesta vacia.
