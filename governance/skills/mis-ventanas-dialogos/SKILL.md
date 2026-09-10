---
name: mis-ventanas-dialogos
description: Cromo de ventanas y diálogos de MIS Host — barra de título con semáforo estilo macOS, tema global de p-dialog y las trampas de PrimeNG que rompen un diálogo en silencio. Usar al crear o modificar cualquier diálogo, panel de módulo o superficie que se abre encima del contenido.
---

# Ventanas y diálogos — MIS Host

Todo lo que se abre encima del contenido usa el mismo cromo: barra clara, semáforo a la izquierda, título centrado. El usuario reconoce "esto es una ventana" sin leer nada.

---

## 1. No inventes cabecera: ya hay una

Un `p-dialog` nuevo **no** define color de cabecera, ni tamaño de título, ni botón de cerrar. El tema global de `src/assets/styles/componentes/dialogo.css` se lo pone.

```html
<p-dialog
  [visible]="visible()"
  (visibleChange)="cerrar()"
  [modal]="true"
  [style]="{ width: '92vw', maxWidth: '620px' }"
  header="Título de la ventana"
  appendTo="body"
>
  …
</p-dialog>
```

Eso ya sale con barra clara, semáforo (roja viva, las otras dos apagadas), cuerpo sobre `--mis-surface` y pie alineado a la derecha, en claro y en oscuro.

**Lo que no hay que escribir**: `background: var(--mis-primary)` en `.p-dialog-header`, `color: white` en el título, ni un `:host ::ng-deep` para repintar el cierre. Si aparece en un componente, es deuda: dos diálogos dejan de parecerse.

---

## 2. El semáforo

| Luz | Clase | `data-glifo` | Significado |
|---|---|---|---|
| Roja | `mis-window-light--cerrar` | `✕` | cerrar |
| Amarilla | `mis-window-light--volver` | `‹` | volver atrás |
| Verde | `mis-window-light--zoom` | `⤢` | pantalla completa |
| Gris | `mis-window-light--apagada` | — | la ventana no ofrece ese control |

La amarilla **no** se llama `--minimizar`: se renombró cuando pasó a navegar hacia atrás, y un diálogo que quedó con el nombre viejo salió con un botón gris del sistema (INC-2026-09-09-01).

### Diálogo con pasos internos

Cuando una luz tiene que **hacer** algo —volver de un listado a su menú—, el diálogo proyecta su propio semáforo. PrimeNG no permite inyectar nada en su grupo de acciones:

```html
<p-dialog [closable]="true" …>
  <ng-template pTemplate="header" let-ariaLabelledBy="ariaLabelledBy">
    <div class="mis-window-lights mis-dialog-lights" role="group" aria-label="Controles del diálogo">
      <button type="button" class="mis-window-light mis-window-light--cerrar"
              data-glifo="✕" (click)="cerrar()" aria-label="Cerrar"></button>
      @if (vista() === 'menu') {
        <span class="mis-window-light mis-window-light--apagada" aria-hidden="true"></span>
      } @else {
        <button type="button" class="mis-window-light mis-window-light--volver"
                data-glifo="‹" (click)="volverAlMenu()" aria-label="Volver al menú"></button>
      }
      <span class="mis-window-light mis-window-light--apagada" aria-hidden="true"></span>
    </div>
    <span [id]="ariaLabelledBy" class="p-dialog-title">Selecciona Nivel</span>
  </ng-template>
```

`.mis-dialog-lights` apaga el semáforo automático. **`closable` se queda en `true`**: el botón se oculta por CSS, pero es lo que PrimeNG mira para que Escape siga cerrando.

Referencia viva: `src/app/pages/modules/incentivos/ui/selector-nivel-dialog/`.

---

## 3. Tres trampas que ya costaron tiempo

### `pTemplate` se resuelve una sola vez

PrimeNG recorre los `pTemplate` en `onAfterContentInit`. Un pie dentro de un `@if` **nunca se registra**: el diálogo se queda sin pie para siempre, aunque la condición se cumpla después.

```html
<!-- ✗ el pie no existe nunca -->
@if (vista() !== 'menu') {
  <ng-template pTemplate="footer">…</ng-template>
}

<!-- ✓ se declara siempre; el paso que no lo necesita esconde el pie -->
<ng-template pTemplate="footer">
  @if (vista() !== 'menu') { <p-button label="Seleccionar" … /> }
</ng-template>
```

Y en el `p-dialog`: `[styleClass]="vista() === 'menu' ? 'mis-dialog--sin-pie' : ''"`.

### `:host ::ng-deep` no llega a `appendTo="body"`

El contenido del diálogo no cuelga del host, así que la regla encapsulada nunca aplica. Lo del cromo va al CSS global; lo de una pantalla va con `styleClass` y una regla global que use esa clase.

### Nada de `!important`

PrimeNG emite su tema en `@layer primeng`; el CSS del repo va sin capa y ya gana la cascada. Agregar `!important` además rompe `[contentStyle]`, que es estilo en línea y debe poder mandar sobre el padding del cuerpo.

---

## 4. Ancho y estados

- El ancho va en `[style]`, con `width: '92vw'` y un `maxWidth` en px.
- Si depende del paso que se muestra, se calcula con `computed()`:

```typescript
protected readonly estiloDialogo = computed(() => ({
  width: '92vw',
  maxWidth: this.vista() === 'menu' ? '620px' : '1000px',
}));
```

- Carga, vacío y error dentro del diálogo siguen las mismas reglas que en una pantalla: `app-list-skeleton`, `app-empty-state`, `app-inline-error`.

---

## 5. Panel de módulo

Una pantalla de módulo no arma su cromo a mano: usa `app-window-panel`, que trae la barra, el semáforo real —el rojo navega al inicio, el amarillo vuelve, el verde hace `requestFullscreen`— y los slots de proyección:

```html
<app-window-panel [titulo]="titulo()" [subtitulo]="fecha()" (actualizar)="cargar()">
  <button ventana-acciones type="button" class="mis-window-btn" (click)="…">…</button>
  <div ventana-filtros>…</div>
  …contenido…
</app-window-panel>
```

---

## 6. Antes de cerrar el cambio

```bash
npm run verify          # incluye anclas de tour y activos
npm test
```

Contrato completo y por qué de cada regla: [`docs/components/ventanas-y-dialogos.md`](../../docs/components/ventanas-y-dialogos.md).
