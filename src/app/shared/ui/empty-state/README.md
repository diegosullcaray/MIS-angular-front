# `<app-empty-state>`

Estado vacío para listas sin datos: ícono, título, descripción y una acción opcional.

Se usa cuando la consulta salió bien pero no hay nada que mostrar. Si lo que pasó fue un
**error**, va [`<app-inline-error>`](../inline-error/README.md); si los datos todavía están en
camino, va [`<app-list-skeleton>`](../list-skeleton/README.md).

## Uso

```typescript
// El número de `../` depende de dónde viva tu componente; no hay alias de rutas en el proyecto.
import { EmptyStateComponent } from '…/shared/ui/empty-state/empty-state.component';

@Component({
  imports: [EmptyStateComponent],
  // ...
})
```

```html
<app-empty-state
  titulo="Elige un nivel"
  descripcion="Selecciona un nivel de la jerarquía en los filtros de arriba para ver el reporte."
/>
```

Con acción, para que el usuario pueda salir del estado vacío sin buscar el botón en otro lado:

```html
<app-empty-state
  icono="lucideUsers"
  titulo="Sin colaboradores"
  descripcion="Este nivel todavía no tiene gente asignada."
  accionLabel="Elegir otro nivel"
  (accion)="abrirSelector()"
/>
```

## API

| Input | Tipo | Por defecto | Para qué |
|---|---|---|---|
| `icono` | `string` | `'lucideInbox'` | Nombre de un ícono de `@ng-icons/lucide` |
| `titulo` | `string` | `'Sin resultados'` | Encabezado |
| `descripcion` | `string` | — | Texto de apoyo; se oculta si no se pasa |
| `accionLabel` | `string` | — | Texto del botón; **sin esto no se dibuja el botón** |

| Output | Cuándo |
|---|---|
| `accion` | Clic en el botón |

Solo `lucideInbox` viene registrado en el componente. Para otro ícono hay que agregarlo a su
`provideIcons({ ... })`, o el `<ng-icon>` queda en blanco.
