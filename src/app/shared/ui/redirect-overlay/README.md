# `<app-redirect-overlay>`

Pantalla de transición al salir a una plataforma externa: spinner grande, el avatar de MIS y el
nombre del destino. Le da al usuario una señal de que el salto es intencional antes de perder el
Host de vista.

Como [`<app-loading-overlay>`](../loading-overlay/README.md), **está montado una sola vez en el
shell** (`shell-layout.component.html`) y no se instancia por pantalla. No tiene inputs: se dispara
llamando a `RedirectOverlayService.redirigir()`.

## Uso

```typescript
// El número de `../` depende de dónde viva tu componente; no hay alias de rutas en el proyecto.
import { RedirectOverlayService } from '…/shared/services/redirect-overlay.service';

export class MiComponente {
  private readonly redirect = inject(RedirectOverlayService);

  irAImparables(): void {
    this.redirect.redirigir('imparables');
  }

  // Cuando el backend devuelve la URL, se le pasa y manda esa.
  abrirDestino(destino: string, url?: string): void {
    this.redirect.redirigir(destino, url);
  }
}
```

## Cómo resuelve la URL

En orden: la `urlDirecta` que se le pase, si no `environment.externalLinks[destino]`, y si no un
fallback por coincidencia parcial del nombre (`imparables`, `jira`, `helpdesk`). El subtítulo se
arma del mismo nombre, así que conviene usar las claves que ya están en `externalLinks` en vez de
inventar una.

## API de `RedirectOverlayService`

| Miembro | Qué es |
|---|---|
| `redirigir(destino, urlDirecta?)` | Muestra el overlay y navega al destino |
| `state` | Signal: `{ visible, titulo, subtitulo, url, mascotaUrl }` |

Agregar un destino nuevo es agregar su clave a `externalLinks` en `src/environments/`, no tocar
este componente.
