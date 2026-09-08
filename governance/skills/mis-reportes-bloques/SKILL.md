---
name: mis-reportes-bloques
description: Cómo se construye un reporte en MIS Host — motores de reporte, BloqueReporteService, jerarquía organizativa y fecha de corte. Usar al agregar o modificar cualquier reporte del módulo reportes, elegir estrategia de consulta o diagnosticar una cifra incorrecta por nivel o fecha.
---

# Reportes por bloques — MIS Host

El módulo `reportes` concentra la mayor superficie funcional del sistema: Clientes, Cartera, Cartera en Mora, Captaciones, Portafolio Reasignado, Seguros, Campañas, Proyecciones, Tablero Digital, PDM, Actividad Mensual, Avance Comercial y Analista. Todos se construyen con las mismas piezas.

---

## 1. Los cuatro motores del backend

Elegir el motor es una decisión de diseño, no un detalle de implementación: define el modelo, el componente de tabla y la forma del estado vacío.

| Motor | Devuelve | Modelo / UI | Método de `ModReportesService` |
|---|---|---|---|
| `regularData` | tablas multi-encabezado y bloques mixtos | `TablaReporteResultado` + `app-tabla-reporte` | `getRegularData()` |
| `table.regular` | columnas dinámicas, headers serializados | `TablaDinamicaResultado` + `app-tabla-dinamica` | `getRegularTableResult()` |
| `graphicData` | bloques de gráfico | `BloqueGrafico` + `app-grafico-mixto` / `app-grafico-pie` | `getGraphicData()` |
| `reportData` | legado | solo compatibilidad, vía `deprecado()` | `getDeprecatedData()` |

`reportData` no se usa en reportes nuevos.

---

## 2. La jerarquía organizativa

Todo reporte se consulta **sobre un nodo**. Elegir mal el nivel produce una cifra plausible y equivocada, con todos los tests en verde: es el error más caro de este dominio.

Las constantes viven en `src/app/pages/modules/reportes/models/jerarquia.model.ts` (y su equivalente en `presupuesto/models/`):

| Constante | Nivel |
|---|---|
| `PARAMS_HIER_FC` | Financiera / Confianza |
| `PARAMS_HIER_MACRO` | macro (alias: `PARAMS_HIER_MACRO_SIN_CORREDOR`) |
| `PARAMS_HIER_UNIDAD` | unidad, zona o agencia según contrato — la más usada |
| `PARAMS_HIER_OFICINA` | oficina |
| `PARAMS_HIER_SEGUROS_PASIVOS` | seguros pasivos |

**No elijas por intuición: copiá la constante de un reporte del mismo dominio.**

El selector `app-hier-selector` entrega un `HierarquiaNodo`; el servicio consume un `NodoConsulta`, que es `tip_cod` + `cod_rel` más campos opcionales. Si el backend exige el nodo completo (con `lvl`, `lbl_hier`), la consulta es `regularPaginado()`.

```typescript
protected readonly paramsHier = PARAMS_HIER_UNIDAD;
```

El caché de jerarquía (`JerarquiaCacheService`) existe porque sin él cada pantalla repetía `base_hier` + `level_hier` en serie antes de consultar el reporte, y 44 pantallas montan el selector. Su clave debe incluir identidad, nodo y fecha: al cambiar a usuario alterno tiene que invalidarse, o un usuario ve datos del anterior.

---

## 3. La fecha de corte

Pertenece al perfil del usuario (`profile.curr_fec`) y `BloqueReporteService` la expone en dos formatos:

- `fec()` → `YYYYMMDD` (compacto), el que se envía por defecto.
- `fecha()` → formato largo, para los contratos que lo exigen.

`regular()` agrega `fec` automáticamente **salvo que el llamador ya haya pasado `fec` o `fecha`**. Si el contrato exige parámetros exactos y no querés esa fecha automática, usá `regularExacto()`.

---

## 4. `BloqueReporteService`: qué estrategia usar

`src/app/pages/modules/reportes/services/bloque-reporte.service.ts`

| Método | Cuándo |
|---|---|
| `regular(codRep, nodo, extra?)` | bloque normal; agrega `fec` si no se envió fecha |
| `regularExacto(codRep, nodo, extra?)` | el contrato exige parámetros exactos, sin fecha automática |
| `regularPaginado(codRep, nodo, extra?, pagina?)` | el backend necesita `pagen` y el nodo completo |
| `regularTolerante(...)` | un 500 significa bloque vacío conocido en ese reporte |
| `regularLento(...)` | bloque que excede los tiempos normales |
| `regulares([{codRep, extra}], nodo)` | varios bloques independientes, en paralelo con `forkJoin` |
| `tablaRegular(codRep, nodo)` | tabla dinámica sobre el nodo |
| `tablaRegularCon(codRep, params, context?)` | tabla dinámica con parámetros propios |
| `graficos(codRep, nodo, extra?)` | bloques Highcharts ya mapeados |
| `periodos(codRep)` | opciones de filtro de período |
| `deprecado(codRep, nodo, extra?)` | solo compatibilidad legada |

### La regla del bloque vacío

Ant responde **500 cuando un bloque no tiene datos**. Eso obliga a distinguir dos cosas que un `catchError` genérico confunde:

```typescript
// Correcto: solo absorbe el error que esBloqueVacio() reconoce como "bloque sin datos"
this.bloques.regularTolerante(COD_REP, nodo)

// Incorrecto: convierte cualquier caída del backend en una tabla vacía
this.reportes.getRegularData(COD_REP, params).pipe(catchError(() => of(TABLA_VACIA)))
```

El segundo patrón es el que degradó al sistema legado: el usuario ve "sin datos", reintenta filtros y nadie se entera de que el backend está caído.

---

## 5. La pantalla

Para el caso habitual —selector de jerarquía arriba, una o varias tablas abajo— existe `app-reporte-simple` (`reportes/ui/reporte-simple/`), que **ya resuelve carga, vacío, error y el selector**:

```html
<app-reporte-simple
  titulo="Uso del App"
  subtitulo="Aplicativo Móvil"
  [paramsHier]="paramsHier"
  [nivel]="nivelActual()"
  [tabla]="tabla()"
  [cargando]="cargando()"
  (nivelSeleccionado)="onNivelSeleccionado($event)"
  (errorJerarquia)="onErrorJerarquia()"
>
  <div nota>Notas al pie del reporte…</div>
</app-reporte-simple>
```

Entradas principales: `titulo`, `subtitulo`, `paramsHier`, `nivel`, y una de `tabla` / `bloques` / `pestanas`, más `cargando`. Salidas: `nivelSeleccionado` y `errorJerarquia` — esta última se emite **solo** cuando la carga inicial de la jerarquía falla o vuelve vacía, que es el único caso en que el selector nunca llega a emitir un nodo; sin escucharla, el contenedor se queda cargando para siempre.

Si usás `app-reporte-simple` o una tabla compartida, **no envuelvas la pantalla en tu propio `@if (vacio())`**: quedarían dos estados vacíos y uno siempre estará mal.

---

## 6. Estructura de archivos

```text
pages/modules/reportes/components/<subdominio>/components/<agrupacion>/
  constantes/<reporte>.constantes.ts
  models/<reporte>.model.ts
  services/<reporte>.service.ts
  items/<reporte>/<reporte>.component.{ts,html,spec.ts}
```

En `reportes`, las pantallas hoja van en `items/`, no en `components/`.

---

## 7. Orden de implementación

1. Completar la [ficha de reporte](../../docs/templates/report-spec-template.md) — obliga a cerrar módulo, jerarquía, motor y estados **antes** de escribir código.
2. Registrar `cod_rep`, ruta legada (`act_sec`), motor y parámetros.
3. Elegir `PARAMS_HIER_*` y documentar nombre y formato de la fecha.
4. Definir el modelo de respuesta y qué significa vacío en ese motor.
5. Implementar el service sobre `BloqueReporteService`.
6. Armar la pantalla, preferentemente con `app-reporte-simple`.
7. Registrar la ruta lazy.
8. Specs: mapeo, service (con los casos vacío ≠ error) y E2E.
9. `npm run inventario` y actualizar el contrato si cambió el borde con backend.

---

## 8. Criterio de terminado

Un reporte no está terminado porque renderiza una tabla. Necesita contrato trazable, jerarquía correcta, fecha de corte con el formato exacto, los estados completos, pruebas que distingan vacío de error, accesibilidad, ruta navegable y evidencia de que un fallo real no se muestra como respuesta vacía.
