# `<app-inline-error>`

Error de API mostrado **dentro** de la vista donde ocurrió, sin romper el layout ni tapar la
pantalla. Trae su propio botón de reintento.

Para un fallo puntual que no debería frenar al usuario (un toast basta), usá `ToastService`. Este
componente es para cuando la sección quedó sin datos y hay que ofrecer reintentar ahí mismo.

## Uso

```typescript
// El número de `../` depende de dónde viva tu componente; no hay alias de rutas en el proyecto.
import { InlineErrorComponent } from '…/shared/ui/inline-error/inline-error.component';

@Component({
  imports: [InlineErrorComponent],
  // ...
})
```

```html
@if (error(); as mensaje) {
  <app-inline-error [detalle]="mensaje" (reintentar)="cargar()" />
}
```

Con título propio, cuando el default genérico no dice lo suficiente:

```html
<app-inline-error
  titulo="No se pudo cargar el dashboard"
  detalle="Inténtalo de nuevo en unos segundos."
  accionLabel="Reintentar"
  (reintentar)="reintentar()"
/>
```

## API

| Input | Tipo | Por defecto | Para qué |
|---|---|---|---|
| `titulo` | `string` | `'Error al cargar datos'` | Línea principal, en rojo |
| `detalle` | `string` | — | Segunda línea; se oculta si no se pasa |
| `accionLabel` | `string` | `'Reintentar'` | Texto del botón; **pasá `''` para ocultarlo** |

| Output | Cuándo |
|---|---|
| `reintentar` | Clic en el botón |

El contenedor lleva `role="alert"`, así que los lectores de pantalla lo anuncian apenas aparece.
