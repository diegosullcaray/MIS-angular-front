# `<app-loading-overlay>`

Pantalla de carga completa, con el Puma institucional latiendo (`animate-pulse`). Cubre todo,
incluidos los diálogos, mientras haya peticiones en vuelo.

La imagen es `assets/images/fc/puma-carga.png` — 110×180 px y 26 KB, recortada del original de
Kaypacha (770×1288, 736 KB), que es demasiado pesado para algo que aparece en cada carga. Se le
quitó además la sombra de piso que el original trae pintada: sobre el velo oscuro del overlay se
veía como un parche blanco. Se pinta a 85×139 para que quede nítida en pantallas densas. Va con `alt=""` y `aria-hidden`: quien usa
lector de pantalla escucha el texto de estado, no una descripción del dibujo.

**No se instancia por pantalla.** Ya está montado una sola vez en el shell
(`shell-layout.component.html`); desde cualquier módulo se controla con `LoadingService`. El
componente no tiene inputs: lee el estado del servicio y se muestra solo.

Para la carga de una sección puntual va [`<app-list-skeleton>`](../list-skeleton/README.md) o el
`[loading]` de `<app-data-table>`. Este overlay es para lo que bloquea la pantalla entera.

## Uso

```typescript
// El número de `../` depende de dónde viva tu componente; no hay alias de rutas en el proyecto.
import { LoadingService } from '…/shared/services/loading.service';

export class MiComponente {
  private readonly loading = inject(LoadingService);

  guardar(): void {
    this.loading.show('Guardando cambios...');
    this.servicio.guardar(this.formulario()).subscribe({
      next: () => this.loading.hide(),
      error: () => this.loading.hide(),
    });
  }
}
```

El servicio **cuenta** las peticiones: cada `show()` incrementa y cada `hide()` decrementa, y el
overlay recién se va cuando el contador llega a cero. Así dos llamadas en paralelo no se apagan
entre sí.

Por eso todo `show()` necesita su `hide()`, también en el camino de error — si no, la pantalla de
carga queda colgada. En un `subscribe` conviene ponerlo en `next` y en `error`, o usar `finalize()`.

## API de `LoadingService`

| Miembro | Qué es |
|---|---|
| `show(mensaje?)` | Muestra la pantalla de carga, con un texto opcional debajo (por defecto, «Cargando…») |
| `hide()` | Descuenta una petición; la oculta si no quedan otras |
| `estado` | Signal de solo lectura: `{ isLoading, message, requestCount }` |
| `cargando` | Atajo `computed<boolean>` para plantillas |

Hay además un método que fuerza el ocultamiento ignorando el contador. Es la salida de emergencia
para cuando un error dejó peticiones sin cerrar; en el flujo normal se usan `show`/`hide`.
