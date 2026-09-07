---
name: angular-mis-zoneless
description: Guía y directrices de desarrollo en Angular 22 Zoneless y reactividad con Signals para MIS Host (Financiera Confianza). Usar al diseñar, crear o modificar componentes, servicios o directivas para garantizar el uso de signal, computed, effect, input, output, inject y ChangeDetectionStrategy.OnPush sin zone.js.
---

# Desarrollo Angular 22 Zoneless & Signals — MIS Host

Este repositorio implementa **Angular 22** configurado en modo **Zoneless** (`provideExperimentalZonelessChangeDetection` o zoneless nativo en Angular 22). En este entorno no existe `zone.js` interceptando eventos asíncronos; las actualizaciones de la interfaz están impulsadas estrictamente por la reactividad de **Signals** y la estrategia **`ChangeDetectionStrategy.OnPush`**.

---

## 1. Reglas Fundamentales de Arquitectura

1. **`ChangeDetectionStrategy.OnPush` obligatorio**:
   Todo componente debe declarar explícitamente `changeDetection: ChangeDetectionStrategy.OnPush` en su decorador `@Component`.
2. **Uso exclusivo de Signals para estado**:
   No usar propiedades mutables simples si afectan la vista. El estado local o compartido debe residir en `signal()`, `computed()` o `linkedSignal()`.
3. **Inyección con `inject()`**:
   No usar inyección en constructor (`constructor(private svc: MyService)`). Usar la función `inject()` a nivel de campo:
   ```typescript
   private readonly service = inject(MiServicio);
   ```
4. **Imports Standalone**:
   Todos los componentes son `standalone: true` (por defecto en Angular 22). Declarar únicamente los módulos o componentes requeridos en el array `imports`.
5. **Prohibido `@Input()` y `@Output()` legacy**:
   Utilizar las funciones `input()`, `input.required()` y `output()`.

---

## 2. Reactividad con Signals

### Estado mutable (`signal`) y derivados (`computed`)
```typescript
import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-contador-morosidad',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>Total clientes: {{ total() }}</div>
    <div>Clientes en riesgo: {{ enRiesgo() }}</div>
  `,
})
export class ContadorMorosidadComponent {
  // Señal de estado
  readonly total = signal<number>(0);
  readonly morosos = signal<number>(0);

  // Señal calculada automáticamente en base a dependencias
  readonly enRiesgo = computed(() => {
    const t = this.total();
    return t > 0 ? (this.morosos() / t) * 100 : 0;
  });

  actualizar(nuevosTotal: number, nuevosMorosos: number): void {
    this.total.set(nuevosTotal);
    this.morosos.set(nuevosMorosos);
  }
}
```

### Entradas y Salidas Modernas (`input`, `output`)
```typescript
import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-tarjeta-saldo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-4 border rounded">
      <h3>{{ titulo() }}</h3>
      <p>Monto: S/ {{ saldo() }}</p>
      <button (click)="alSeleccionar.emit(id())">Ver detalle</button>
    </div>
  `,
})
export class TarjetaSaldoComponent {
  // Entradas requeridas y opcionales
  readonly id = input.required<string>();
  readonly titulo = input.required<string>();
  readonly saldo = input<number>(0);

  // Salida tipada
  readonly alSeleccionar = output<string>();
}
```

---

## 3. Manejo de Peticiones Asíncronas en Servicios

Los servicios deben encapsular la llamada HTTP y exponer señales de solo lectura para la vista:

```typescript
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CarteraService {
  private readonly http = inject(HttpClient);

  // Estado privado
  private readonly _items = signal<CarteraItem[]>([]);
  private readonly _cargando = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // Exposición pública de solo lectura
  readonly items = this._items.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();

  // Señal computada derivada
  readonly totalRegistros = computed(() => this._items().length);

  consultar(filtro: FiltroCartera): Observable<CarteraItem[]> {
    this._cargando.set(true);
    this._error.set(null);

    return this.http.get<CarteraDto[]>('/api/cartera', { params: { ...filtro } }).pipe(
      map(dtos => dtos.map(mapCarteraDtoToItem)),
      tap(items => {
        this._items.set(items);
        this._cargando.set(false);
      }),
      catchError(err => {
        this._error.set('Error al consultar cartera. Reintente.');
        this._cargando.set(false);
        return of([]);
      })
    );
  }
}
```

---

## 4. Control de Flujo en Plantillas (Templates)

No usar `*ngIf`, `*ngFor` ni `*ngSwitch`. Usar la sintaxis integrada de Angular:

```html
<!-- Condicional -->
@if (cargando()) {
  <p-progressSpinner />
} @else if (error()) {
  <div class="error-banner">{{ error() }}</div>
} @else if (items().length === 0) {
  <p>No se encontraron resultados.</p>
} @else {
  <!-- Bucle con track obligatorio -->
  @for (item of items(); track item.id) {
    <div class="fila">
      <span>{{ item.codigo }}</span>
      <span>{{ item.monto }}</span>
    </div>
  }
}
```

---

## 5. Anti-Patrones a Evitar

- ❌ **Evitar suscripciones manuales innecesarias en componentes**: Preferir enlazar las señales del servicio directamente a la plantilla.
- ❌ **No mutar señales con referencias de objetos**: Usar `signal.update(items => [...items, nuevo])` para generar una nueva referencia inmutable.
- ❌ **No usar decoradores antiguos**: Nada de `@Input()`, `@Output()`, `@ViewChild()`. Usar `input()`, `output()`, `viewChild()`.
- ❌ **No llamar `ChangeDetectorRef.detectChanges()` manualmente** a menos que interactúes con una librería externa desprovista de ciclo Angular.
