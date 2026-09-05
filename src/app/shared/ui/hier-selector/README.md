# `<app-hier-selector>`

Selector de jerarquía organizativa en cascada: un `p-select` por nivel, cada uno traído del backend
según lo elegido en el anterior, más un botón "Limpiar" que vuelve a la raíz.

## Por qué está acá

En el legado STG era **un solo componente** (`hier-rem-selector`) que Reportes y Presupuesto
configuraban igual —el mismo `confHier` (`roots`, `cod_hier`, `params_hier`, `max_lvl`)— contra las
mismas dos llamadas de `admin`: `base_hier` y `level_hier`. Al migrarse cada módulo por separado
quedaron dos copias que fueron divergiendo. Este componente las reunifica, y lo que cada copia
había agregado quedó como input opcional.

## Uso

```typescript
// El número de `../` depende de dónde viva tu componente; no hay alias de rutas en el proyecto.
import { HierSelectorComponent } from '…/shared/ui/hier-selector/hier-selector.component';
import { PARAMS_HIER_UNIDAD } from '…/pages/modules/reportes/models/jerarquia.model';

@Component({
  imports: [HierSelectorComponent],
  // ...
})
export class MiReporte {
  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.cargar({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel });
  }
}
```

```html
<app-hier-selector
  [paramsHier]="paramsHier"
  (nodoSeleccionado)="onNivelSeleccionado($event)"
  (error)="onErrorJerarquia()"
/>
```

`paramsHier` dice **qué** jerarquía recorrer y hasta qué profundidad. El catálogo de jerarquías
—el `getHierarchyConfig()` del legado— vive en `reportes/models/jerarquia.model.ts`:
`PARAMS_HIER_UNIDAD` (organizativa), `PARAMS_HIER_OFICINA`, `PARAMS_HIER_FC`, `PARAMS_HIER_MACRO`.

## API

| Input | Tipo | Por defecto | Para qué |
|---|---|---|---|
| `paramsHier` | `ParamsJerarquia` | — | **Requerido.** Qué jerarquía y hasta qué nivel |
| `placeholder` | `string` | `'Elegir jerarquía'` | Placeholder de los desplegables |
| `autoSeleccionar` | `boolean` | `true` | Preselecciona la raíz y la emite al cargar |
| `raizFija` | `HierarquiaNodo[] \| null` | `null` | Raíz ya conocida; ahorra la llamada a `base_hier` |
| `anchoCompleto` | `boolean` | `false` | Ocupa todo el ancho y manda "Limpiar" a la derecha |
| `reintentarSinFecha` | `boolean` | `false` | Reintenta sin filtro de fecha si un nivel vuelve vacío |

| Output | Cuándo |
|---|---|
| `nodoSeleccionado` | Se elige un nivel (y al cargar, si `autoSeleccionar`) |
| `rutaSeleccionada` | Siempre: la ruta completa de la raíz al nivel elegido |
| `error` | **Solo** si falla o queda vacía la carga inicial |

`error` es deliberadamente estrecho: es el único caso en que el componente nunca llegará a emitir
`nodoSeleccionado`, así el contenedor puede apagar su loading en vez de esperar para siempre.
Usá `crearManejadorErrorJerarquia()` (en `reportes/utils/`) para el manejo estándar.

`rutaSeleccionada` se emite siempre, incluso al volver a la raíz tras "Limpiar": una pantalla que
espera N niveles necesita enterarse de que quedó en 1 para vaciar su tabla.

## La fecha de corte

Cada nivel se pide con `fec` = `fechaCorteJerarquia(usuarioActivo().fechaCorte)`, que cae a **ayer**
si el backend todavía no declaró la suya. Nunca hoy: pedir el día en curso devuelve
`level_hierarchy` vacío y el selector queda en "No se pudo cargar la jerarquía".

`reintentarSinFecha` nació como parche en Presupuesto, cuya copia caía a HOY y chocaba justo con
eso. Con la fecha unificada ese caso ya no debería darse, y el input queda como red de contención —
las pantallas de Presupuesto lo mantienen encendido para no cambiar su comportamiento.
