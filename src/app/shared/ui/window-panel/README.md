# `<app-window-panel>`

Panel de módulo con cromo de ventana macOS: barra de título, semáforo funcional y botón de
actualizar en la esquina. Es el contenedor estándar de **toda pantalla de módulo** del Host.

El semáforo navega de verdad:

| Luz | Qué hace |
|---|---|
| 🔴 Roja | Emite `cerrar` y navega a `/app/dashboard` |
| 🟡 Amarilla | Emite `volver` y sube un nivel — ver abajo |
| 🟢 Verde | Pantalla completa sobre el host del panel (`requestFullscreen`) |

## Uso

```typescript
// El número de `../` depende de dónde viva tu componente; no hay alias de rutas en el proyecto.
import { WindowPanelComponent } from '…/shared/ui/window-panel/window-panel.component';

@Component({
  imports: [WindowPanelComponent],
  // ...
})
```

```html
<app-window-panel
  titulo="Becas Financiera Confianza"
  [subtitulo]="colaborador()?.nombre ?? ''"
  [actualizando]="cargando()"
  etiquetaActualizar="Actualizar becas"
  (actualizar)="reintentar()"
>
  <!-- El contenido sin slot va al cuerpo del panel. -->
  <app-data-table [columns]="columnas" [data]="filas()" />
</app-window-panel>
```

### Slots de proyección

Tres puntos donde el módulo mete lo suyo, como atributo del elemento proyectado:

```html
<app-window-panel titulo="Gestión Comercial" subtitulo="Cartera" [conFiltros]="true">
  <!-- Junto al semáforo, a la izquierda: navegación de la pantalla. -->
  <button ventana-navegacion type="button" class="mis-window-btn" (click)="volver()">
    <i class="pi pi-arrow-left text-[14px]"></i>
  </button>

  <!-- A la derecha, antes de "Actualizar": acciones del módulo. -->
  <button ventana-acciones type="button" class="mis-window-btn" (click)="exportar()">
    <i class="pi pi-download text-[14px]"></i>
  </button>

  <!-- Franja colapsable bajo la barra; requiere [conFiltros]="true". -->
  <app-hier-selector ventana-filtros [paramsHier]="paramsHier" (nodoSeleccionado)="onNivel($event)" />

  <!-- Cuerpo. -->
  @if (!nivelActual()) {
    <app-empty-state titulo="Elige un nivel" />
  }
</app-window-panel>
```

## API

| Input | Tipo | Por defecto | Para qué |
|---|---|---|---|
| `titulo` | `string` | `''` | Título centrado en la barra |
| `subtitulo` | `string` | `''` | Texto secundario, tras un guión |
| `volverA` | `string` | `''` | Destino fijo de la luz amarilla. Vacío = lo resuelve sola |
| `etiquetaVolver` | `string` | `'Volver'` | Tooltip y `aria-label` de la luz amarilla |
| `permitirActualizar` | `boolean` | `true` | Muestra el botón de la esquina |
| `actualizando` | `boolean` | `false` | Gira el ícono y deshabilita el botón |
| `etiquetaActualizar` | `string` | `'Actualizar'` | Tooltip y `aria-label` de ese botón |
| `mostrarSemaforo` | `boolean` | `true` | Apagalo en paneles anidados |
| `conRelleno` | `boolean` | `true` | `false` deja el contenido a sangre (tablas) |
| `altoAuto` | `boolean` | `false` | Alto natural del contenido en vez de llenar el viewport |
| `conFiltros` | `boolean` | `false` | Botón de filtros + franja que proyecta `[ventana-filtros]` |
| `filtrosAbiertos` | `boolean` | `false` | Estado **inicial** de esa franja |

| Output | Cuándo |
|---|---|
| `actualizar` | Clic en el botón de la esquina (no se emite si `actualizando` es `true`) |
| `cerrar` | Luz roja, **antes** de navegar al inicio |
| `volver` | Luz amarilla, **antes** de navegar |

`filtrosAbiertos` es un `linkedSignal`: fija el valor inicial, pero después el usuario manda con el
botón de filtros. Cambiarlo desde afuera reabre la franja.

El estado de pantalla completa se lee de `fullscreenchange`, no del clic: salir con `Esc` deja el
ícono y el `aria-pressed` correctos.

## A dónde vuelve la luz amarilla

Resuelve en tres pasos, y se queda con el primero que aplique:

1. **`volverA`**, si la pantalla fijó un destino. Lo usan `becas` y
   `priorizacion-leads`, que vuelven a su listado.
2. **El explorador del sistema**, si el sistema activo tiene uno y no está ya a
   la vista. Se levanta con `ShellStateService.setContenidoPendienteSeleccion(true)`;
   **la ruta no cambia**, así que el contenido vuelve intacto.
3. **El historial** (`Location.back()`), para todo lo demás.

El paso 2 no es un atajo: el explorador **no es una ruta**. Se pinta sobre el
`<router-outlet>` desde el estado del shell, así que abrir un reporte desde ahí
deja una sola entrada de historial, y retroceder se saltaba el explorador entero
para devolver al usuario al Home. Ver INC-2026-09-08-06.

Tampoco sirve calcular la ruta padre: las rutas de reportes son planas, con el
path completo en un solo `Route` (`'leg/com/rda/adm/res-mov'`), y recortar un
segmento apunta a una URL inexistente que el comodín `**` convierte en un 404.
