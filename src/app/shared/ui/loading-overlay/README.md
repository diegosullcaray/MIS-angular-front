# `<app-loading-overlay>`

Spinner de pantalla completa. Cubre todo, incluidos los diálogos, mientras haya peticiones en
vuelo.

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

Por eso todo `show()` necesita su `hide()`, también en el camino de error — si no, el spinner queda
colgado. En un `subscribe` conviene ponerlo en `next` y en `error`, o usar `finalize()`.

## API de `LoadingService`

| Miembro | Qué es |
|---|---|
| `show(mensaje?)` | Muestra el spinner, con un texto opcional debajo |
| `hide()` | Descuenta una petición; oculta el spinner si no quedan otras |
| `estado` | Signal de solo lectura: `{ isLoading, message, requestCount }` |
| `cargando` | Atajo `computed<boolean>` para plantillas |

Hay además un método que fuerza el ocultamiento ignorando el contador. Es la salida de emergencia
para cuando un error dejó peticiones sin cerrar; en el flujo normal se usan `show`/`hide`.
