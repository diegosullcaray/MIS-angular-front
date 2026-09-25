# `<app-loading-overlay>`

Pantalla de carga completa: un anillo girando con el Puma de espera en el centro. Cubre todo,
incluidos los diálogos, desde que arranca una consulta hasta su **primera respuesta** (ver
"Carga independiente" más abajo); lo que sigue cargando se ve por el esqueleto de cada tabla.

El anillo es un `<p-progress-spinner>` y la imagen es `assets/images/fc/avatars/mis_wait.png`, el
Puma institucional de espera. **Es la misma composición —y el mismo archivo— que usan
[`<app-redirect-overlay>`](../redirect-overlay/) y el spinner del login**, que ya lo descargan
antes de que aparezca esta pantalla: reusarlo no suma peso, es la misma entrada de caché.

El anillo es lo que comunica que algo está en curso, así que con `prefers-reduced-motion` no se
apaga: gira más lento (2.4 s), igual que el botón de actualizar de los paneles. La imagen va con
`alt=""` y `aria-hidden`: quien usa lector de pantalla escucha el texto de estado, no una
descripción del dibujo.

**No se instancia por pantalla.** Ya está montado una sola vez en el shell
(`shell-layout.component.html`); desde cualquier módulo se controla con `LoadingService`. El
componente no tiene inputs: lee el estado del servicio y se muestra solo.

Para la carga de una tabla va su propio esqueleto (`[cargando]`, o `[loading]` de
`<app-data-table>`); para otra sección puntual, [`<app-list-skeleton>`](../list-skeleton/README.md).
Este overlay es para lo que bloquea la pantalla entera.

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

## Carga independiente de las peticiones HTTP

El `loadingInterceptor` no usa `show()`/`hide()`: usa `iniciarPeticion()`/`terminarPeticion()`.
**Toda consulta que arranca muestra el overlay**, y este se corta con la **primera respuesta** que
llega después: desde ahí la sección ya tiene algo que mostrar y cada tabla que sigue esperando
pinta su propio esqueleto (`cargando` de las tablas compartidas). Los reportes de varios bloques
reciben cada tabla apenas llega (`BloqueReporteService.regulares()` emite por bloque, con
`TABLA_PENDIENTE` en los que faltan). Una consulta nueva (otro nivel, filtro o pantalla) vuelve a
mostrar el overlay aunque quede alguna anterior en vuelo.

Los `show()` manuales (guardar, operaciones que sí deben bloquear) siguen cubriendo la pantalla
hasta su `hide()`, aunque las peticiones ya hayan respondido.

## API de `LoadingService`

| Miembro | Qué es |
|---|---|
| `show(mensaje?)` | Muestra la pantalla de carga, con un texto opcional debajo (por defecto, «Cargando…») |
| `hide()` | Descuenta una petición; la oculta si no quedan otras |
| `iniciarPeticion()` / `terminarPeticion()` | Uso del interceptor: carga independiente (ver arriba) |
| `estado` | Signal de solo lectura: `{ isLoading, message, requestCount }` |
| `cargando` | Atajo `computed<boolean>` para plantillas |

Hay además un método que fuerza el ocultamiento ignorando el contador. Es la salida de emergencia
para cuando un error dejó peticiones sin cerrar; en el flujo normal se usan `show`/`hide`.
