---
name: mis-tours-guiados
description: Recorridos guiados de MIS Host sobre driver.js — cómo declarar los pasos, a qué anclarlos (selector estable, nunca un id de tour), cómo se muestra el personaje de la marca y qué compuerta verifica que el recorrido no se rompa en silencio. Usar al crear o modificar un tour, o al publicar una novedad en el Home.
---

# Recorridos guiados — MIS Host

El sistema se explica a sí mismo: oscurece la pantalla, resalta un elemento y un globo cuenta qué es, con el personaje de la marca al lado.

---

## 1. Una sola puerta a driver.js

`DriverTourService` (`src/app/shared/services/driver-tour.service.ts`) es el único lugar que importa la librería. Un catálogo de tour declara pasos y los entrega:

```typescript
@Injectable({ providedIn: 'root' })
export class MiTourService {
  private readonly driverTour = inject(DriverTourService);

  iniciarTourGuiado(): void {
    this.driverTour.createQuickTour(PASOS);
  }
}
```

Importar `driver.js` directo se saltea el cierre limpio (`forceClose()` barre popovers residuales) y el reacomodo de globos en móvil.

---

## 2. El ancla es lo más importante del paso

Un paso encuentra su elemento **por selector CSS, en tiempo de ejecución**. Si el selector no resuelve, driver.js lo saltea en silencio: `skipMissingElement` está activo, no hay error, no hay spec que falle, y el usuario ve un recorrido con agujeros.

**Regla ([ADR-0004](../../docs/architecture/adr/ADR-0004-anclas-de-tour-por-selector-estable.md)): se apunta a lo que ya identifica al elemento.** No se agregan `id="tour-*"` a las plantillas de los módulos.

```typescript
const ANCLA = {
  rail: '#tour-sidebar-icons',
  perfil: 'header [aria-haspopup="true"]',
  comunicados: 'header button[aria-label="Comunicados del sistema"]',
  tema: 'header button[aria-label^="Activar modo"]',
  recientes: '.recientes',
} as const;
```

Si un control no es localizable, lo que falta es su etiqueta accesible: agregá el `aria-label` —que sirve al lector de pantalla **y** al tour— antes que un `id` decorativo.

Los selectores van juntos en una constante `ANCLA` al principio del catálogo. Repartidos por los pasos, nadie puede auditarlos de un vistazo.

---

## 3. El paso

```typescript
{
  element: ANCLA.perfil,
  popover: {
    title: '👤 Tu menú de perfil',
    description: conMascota('Abrí este menú y vas a ver tu tarjeta arriba, con tu nombre y tu correo.'),
    side: 'bottom',
    align: 'end',
  },
}
```

- `side` y `align` se eligen contra el borde donde vive el elemento: un control del header va `bottom`; el rail izquierdo, `right`; algo al pie, `top`. En pantallas de menos de 640 px, `DriverTourService` reacomoda solo los que quedarían fuera.
- El texto habla de lo que el usuario ve, no de la implementación. "La luz amarilla vuelve atrás", no "`volverAlMenu()` resetea la vista".

---

## 4. El personaje

El globo lleva al personaje de la marca. Se arma dentro de `description`, que driver.js pinta con `innerHTML`:

```typescript
function conMascota(texto: string, pose: 'guia' | 'celebra' = 'guia'): string {
  return `<span class="mis-tour-fila"><img class="mis-tour-mascota mis-tour-mascota--${pose}" src="/assets/images/fc/tours/mascota-${pose}.png" alt="" aria-hidden="true"><span class="mis-tour-texto">${texto}</span></span>`;
}
```

Dos condiciones:

- **El texto es literal nuestro.** Se inyecta como HTML: nada del usuario ni del backend entra ahí.
- **La imagen es decorativa** (`alt=""`, `aria-hidden="true"`). El mensaje lo lleva el texto; un lector de pantalla no debe oír "imagen de puma" en cada paso.

Las piezas de `src/assets/images/fc/tours/` son recortes del render oficial, no dibujos nuevos. Si agregás una pose, mirá el peso: `npm run audit:activos` marca todo lo que pase de 500 kB.

---

## 5. Publicar una novedad en el Home

El panel lateral del Home (`app-panel-novedades`) lista lo que entrega `NovedadesTourService`. Agregar una novedad es agregar una entrada al catálogo:

```typescript
{
  id: 'menu-perfil',
  titulo: 'Tu perfil, como en Chrome',
  resumen: 'Tarjeta con tu cuenta y cambio de perfil en un solo clic.',
  icono: 'pi pi-user',
  fecha: '2026-09-08',
  pasos: [ /* … */ ],
}
```

El panel ordena por `fecha` y muestra la etiqueta "Nuevo" durante 30 días. El `id` es único: `iniciar(id)` lo busca ahí.

---

## 6. La compuerta

```bash
npm run audit:anclas              # informe
npm run audit:anclas -- --check   # falla si hay anclas rotas
npm run verify                    # la incluye en la cadena estática
```

Resuelve cada selector contra las plantillas y estilos reales. Reporta **rotas** (error), **huérfanas** —`id="tour-*"` que ningún paso usa— y **externas**, las que apuntan a marcado de PrimeNG o driver.js y no se pueden verificar contra `src/`.

Apoyarse en una clase de librería (`.p-datatable`) es aceptar que una actualización la puede renombrar sin avisar.

---

## 7. Antes de cerrar el cambio

```bash
npm run audit:anclas -- --check
npm test
```

Y probá el recorrido completo en pantalla: que cada paso resalte lo que dice, y que Esc lo cierre en cualquier punto.

Contrato completo: [`docs/components/tours-guiados.md`](../../docs/components/tours-guiados.md).
