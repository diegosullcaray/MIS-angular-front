# `burbuja-flotante/` — burbuja de diálogo pegada a un ancla

`appBurbujaFlotante` hace flotar un globo de texto (el de la mascota) por delante de la página,
pegado a un elemento ancla. Se lleva al `body` —como el `appendTo="body"` de los selects— para que
ni el scroll ni el vidrio (`backdrop-filter`) de `app-window-panel` la recorten, y no ocupa lugar en
el layout: no agranda la tarjeta ni tapa al ancla.

```html
<img #mascota src="…" alt="Mascota de MIS" />
<div [appBurbujaFlotante]="mascota" class="group w-52 rounded-2xl …">
  <span class="… group-data-[ubicacion=arriba]:-bottom-1 …" aria-hidden="true"></span>
  <p>{{ mensaje() }}</p>
</div>
```

| Input | Por defecto | Qué hace |
|---|---|---|
| `appBurbujaFlotante` | — | Elemento ancla |
| `arribaDesde` | `(min-width: 1024px)` | Desde ese ancho va encima del ancla; por debajo, a su derecha |
| `separacion` | `6` | Píxeles entre burbuja y ancla (y borde del contenedor) |

- Escribe `data-ubicacion="arriba|derecha"` en la burbuja para orientar la punta con
  `group-data-[ubicacion=…]:`.
- Se reubica al hacer scroll, al cambiar el tamaño de la ventana, del ancla o de su contenedor.
- Va en z-index 20: por delante del contenido y por debajo del header, el menú lateral y los
  overlays de PrimeNG.
- Se oculta cuando el ancla sale del área visible de su contenedor con scroll (o está oculta).
- Al destruirse el componente, la burbuja sale del `body`.
