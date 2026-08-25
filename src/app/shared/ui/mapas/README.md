# Mapas

Mapas sobre [MapLibre GL](https://maplibre.org/). Hoy solo vive acá `<app-mapa-ubicacion>`.

## `<app-mapa-ubicacion>`

Pinta un punto en el mapa a partir de sus coordenadas. Sirve para cualquier cosa que se ubique
—una agencia, un corresponsal, un cliente— porque no sabe qué está mostrando: recibe `lat`, `lng` y
una etiqueta, nada más.

```typescript
// El número de `../` depende de dónde viva tu componente; no hay alias de rutas en el proyecto.
import { MapaUbicacionComponent } from '…/shared/ui/mapas/mapa-ubicacion/mapa-ubicacion.component';

@Component({
  imports: [MapaUbicacionComponent],
  // ...
})
```

```html
<!-- El alto lo fija el contenedor. -->
<div class="mis-card p-3 h-[320px]">
  <app-mapa-ubicacion [lat]="cliente().lat" [lng]="cliente().lng" [etiqueta]="cliente().nombre" />
</div>
```

Varias ubicaciones a la vez son varias instancias:

```html
@for (u of ubicaciones(); track u.id) {
  <app-mapa-ubicacion [lat]="u.lat" [lng]="u.lng" [etiqueta]="u.etiqueta" />
}
```

| Input | Tipo | Por defecto | Para qué |
|---|---|---|---|
| `lat` | `number` | — | **Requerido.** Latitud |
| `lng` | `number` | — | **Requerido.** Longitud |
| `etiqueta` | `string` | `''` | Texto del marcador |

El estilo del mapa sigue el tema claro/oscuro vía `ThemeService`, igual que las gráficas. La
instancia de MapLibre se destruye sola al salir del componente.
