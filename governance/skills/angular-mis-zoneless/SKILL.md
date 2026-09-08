---
name: angular-mis-zoneless
description: Arquitectura Angular 22 zoneless y reactividad con señales en MIS Host. Usar al crear o modificar componentes, servicios y directivas, para aplicar signal, computed, effect, input, output e inject() sin zone.js. Explica por qué este proyecto NO usa ChangeDetectionStrategy.OnPush.
---

# Angular 22 zoneless y señales — MIS Host

El proyecto corre con `provideZonelessChangeDetection()` en `src/app/app.config.ts`. Sin `zone.js` no hay nada interceptando `setTimeout`, promesas ni eventos del DOM para disparar una detección global: **la vista se actualiza porque una señal que la plantilla leyó cambió de valor**.

---

## 1. Reglas de arquitectura

### Estado en señales

Cualquier valor que la plantilla muestre vive en `signal()`, `computed()` o `linkedSignal()`. Una propiedad de clase mutada a mano no notifica a nadie y la vista queda vieja.

### Inyección con `inject()`

```typescript
private readonly service = inject(MiServicio);   // así
constructor(private service: MiServicio) {}      // no
```

### `input()` y `output()`, no decoradores

```typescript
readonly id = input.required<string>();
readonly saldo = input<number>(0);
readonly seleccionar = output<string>();
```

Un decorador no es una señal: no se puede componer con `computed()` ni leer desde un `effect()`. Quedan dos `@Input()` heredados en diálogos del repo; no sumar más. Lo mismo con `viewChild()` y `contentChild()` en lugar de `@ViewChild()` / `@ContentChild()`.

### `standalone: true` explícito

Es el default en Angular 22, pero 235 de los 236 componentes lo escriben. Seguí la convención local.

### Sobre `ChangeDetectionStrategy.OnPush`

**Este proyecto no lo usa: 0 de 236 componentes lo declaran, y es deliberado.**

`OnPush` sirve para acotar el barrido global que dispara `zone.js`. En una aplicación zoneless no hay barrido global que acotar: Angular refresca únicamente las vistas marcadas como sucias por una señal o un binding de evento, que es justamente lo que `OnPush` buscaba conseguir. Agregarlo no cambia el comportamiento y sí introduce inconsistencia con el resto del código.

Si venís de una guía genérica de Angular que lo declara obligatorio: acá no aplica.

---

## 2. Señales en la práctica

```typescript
import { Component, computed, signal } from '@angular/core';

@Component({
  selector: 'app-contador-morosidad',
  standalone: true,
  template: `
    <p>Total clientes: {{ total() }}</p>
    <p>Clientes en riesgo: {{ porcentajeRiesgo() }}%</p>
  `,
})
export class ContadorMorosidadComponent {
  readonly total = signal(0);
  readonly morosos = signal(0);

  readonly porcentajeRiesgo = computed(() => {
    const t = this.total();
    return t > 0 ? (this.morosos() / t) * 100 : 0;
  });

  actualizar(total: number, morosos: number): void {
    this.total.set(total);
    this.morosos.set(morosos);
  }
}
```

Regla de inmutabilidad: `update()` genera una referencia nueva. Mutar el objeto que la señal ya contiene no dispara nada.

```typescript
this.items.update((items) => [...items, nuevo]);   // así
this.items().push(nuevo);                          // no notifica: la vista no se entera
```

`effect()` es para sincronizar con el mundo exterior (DOM imperativo, librerías, almacenamiento). Derivar un valor es trabajo de `computed()`, no de un `effect()` que escribe en otra señal.

---

## 3. Servicios: señales privadas, lectura pública

```typescript
@Injectable({ providedIn: 'root' })
export class CarteraService {
  private readonly ant = inject(ModReportesService);

  private readonly _filas = signal<CarteraFila[]>([]);
  private readonly _cargando = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly filas = this._filas.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();

  /** Vacío verdadero: respondió bien y no hay filas. Distinto de un error. */
  readonly vacio = computed(() => !this._cargando() && !this._error() && this._filas().length === 0);

  consultar(params: Record<string, unknown> = {}): void {
    this._cargando.set(true);
    this._error.set(null);

    this.ant.getRegularTableResult(COD_CARTERA, params).subscribe({
      next: (r) => {
        this._filas.set(mapCarteraFilas((r.body as CarteraBody)?.resultado?.data));
        this._cargando.set(false);
      },
      error: () => {
        this._filas.set([]);
        this._error.set('No se pudo consultar la cartera. Reintentá en unos segundos.');
        this._cargando.set(false);
      },
    });
  }
}
```

Tres detalles que no son opcionales:

1. **El transporte es Winder/Ant**, vía los `Mod*Service` de `src/app/core/winder/instances/`. Este sistema no expone REST: ver [`mis-winder-ant`](../mis-winder-ant/SKILL.md).
2. **El error nunca se convierte en lista vacía.** `catchError(() => of([]))` disfraza un 500 de "sin datos".
3. **`vacio` es derivado**, no una cuarta señal que alguien tenga que acordarse de sincronizar.

---

## 4. Control de flujo en plantillas

Bloques nativos, no directivas estructurales. El repo tiene cero `*ngIf`, y no hace falta importar `CommonModule` para esto.

```html
@if (error()) {
  <app-inline-error [detalle]="error()!" (reintentar)="consultar()" />
} @else if (cargando()) {
  <app-list-skeleton />
} @else if (vacio()) {
  <app-empty-state titulo="Sin resultados" />
} @else {
  @for (fila of filas(); track fila.codigo) {
    <div class="flex justify-between">
      <span>{{ fila.codigo }}</span>
      <span class="tabular-nums">{{ fila.montoFormateado }}</span>
    </div>
  } @empty {
    <p>Nada que mostrar.</p>
  }
}
```

`track` es obligatorio en `@for` y debe ser una identidad estable: `track $index` sobre datos que se reordenan reconstruye el DOM entero.

---

## 5. Antipatrones

| Antipatrón | Por qué falla acá |
|---|---|
| `ChangeDetectionStrategy.OnPush` | no aporta en zoneless e introduce inconsistencia |
| Suscribirse en el componente para copiar a una propiedad | enlazá la señal del servicio directo en la plantilla |
| `this.items().push(x)` | misma referencia: la vista no se entera |
| `effect()` que escribe otra señal | eso es un `computed()` |
| `detectChanges()` manual | solo justificable al integrar una librería externa fuera del ciclo |
| `@Input()` / `@Output()` / `@ViewChild()` | usá `input()`, `output()`, `viewChild()` |
| `*ngIf` / `*ngFor` | el auditor lo marca como error |
| `catchError(() => of([]))` en un service de pantalla | convierte una caída en tabla vacía |

Verificación: `node governance/scripts/validar-gobernanza.mjs --regla=entrada-salida-señal,control-flujo-moderno,error-no-silenciado`
