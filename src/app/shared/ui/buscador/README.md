# `<app-buscador>`

Búsqueda instantánea del Host, con la relevancia de Algolia reimplementada en local
(`buscador.service.ts`): tolerancia a typos, prefijos, proximidad, resaltado y facetas.

**El buscador no conoce ningún módulo.** Se alimenta de las fuentes registradas en el multi-token
`FUENTE_BUSQUEDA`, así que un módulo se hace buscable sin tocar este componente.

Ya está montado en el explorador del sistema (`explorador-sistema.component.html`). Lo habitual no
es instanciarlo, sino **registrar una fuente**.

## Registrar un módulo en el buscador

Una fuente devuelve los registros que el módulo ya tiene cargados. Tiene que ser reactiva (leer
signals): el buscador la evalúa dentro de un `computed`, así que la data que llega después entra
sola al índice.

```typescript
import { Injectable, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
// El número de `../` depende de dónde viva tu servicio.
import type { FuenteBusqueda, RegistroBuscable } from '…/shared/ui/buscador/buscador.model';

@Injectable({ providedIn: 'root' })
export class FuenteMiModuloService implements FuenteBusqueda {
  private readonly router = inject(Router);
  private readonly servicio = inject(MiModuloService);

  readonly id = 'mi-modulo';

  private readonly items = computed<RegistroBuscable[]>(() =>
    this.servicio.reportes().map((r) => ({
      id: `mi-modulo:${r.cod}`,
      etiqueta: r.nombre,
      ubicacion: `Mi Módulo › ${r.carpeta}`,
      origen: 'Mi Módulo',
      tipo: 'Reporte',
      abrir: () => void this.router.navigateByUrl(`/app/mi-modulo/${r.cod}`),
    }))
  );

  registros(): RegistroBuscable[] {
    return this.items();
  }
}
```

Y se registra en `app.config.ts`, junto a las que ya están:

```typescript
{ provide: FUENTE_BUSQUEDA, useExisting: FuenteMiModuloService, multi: true },
```

Cada fuente es responsable de respetar los permisos: **solo debe devolver lo que ese usuario puede
abrir** (ver `FuenteNavegacionService`, que reusa el filtro de roles del explorador).

## `RegistroBuscable`

| Campo | Para qué |
|---|---|
| `id` | Identidad estable; también evita indexar dos veces lo mismo |
| `etiqueta` | Lo que se busca y se muestra en grande |
| `ubicacion` | Contexto legible: `Reportes › Avance Comercial` |
| `origen` | De qué módulo salió |
| `tipo` | Qué clase de ítem es (`Reporte`, `Carpeta`, `Dashboard`…) — es la faceta que se ofrece como chips |
| `abrir` | Qué hacer al elegirlo; lo define la fuente, que es la que sabe navegar |

Se busca sobre `etiqueta` y `ubicacion`, en ese orden: un match en el nombre pesa más que uno en la
ubicación. Empatados los cinco criterios textuales, las carpetas van al final — abrir una pantalla
es más útil que abrir otra lista.

## Usar el motor por separado

`BuscadorService` no depende del componente; sirve para cualquier lista en memoria:

```typescript
const indice = inject(BuscadorService).crearIndice(
  {
    atributosBuscables: [{ nombre: 'nombre', valor: (c) => c.nombre }],
    atributosFacetables: [{ nombre: 'agencia', valor: (c) => c.agencia }],
    id: (c) => c.dni,
  },
  clientes()
);

const { resultados, facetas } = indice.buscar('juan per', {
  estrategiaSinResultados: 'ultimas',
  maximoResultados: 20,
});
```

`crearIndice()` es caro: envolvelo en un `computed` sobre los datos, no lo llames en cada tecla.
Los parámetros de `buscar()` y sus defaults están documentados en `buscador.model.ts`, con el
nombre original de Algolia entre paréntesis.
