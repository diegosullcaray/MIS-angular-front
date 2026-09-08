---
name: mis-component-styling
description: Estándar visual de MIS Host con tokens --mis-*, PrimeNG 21 y Tailwind v4. Usar al construir pantallas, tablas, diálogos, tarjetas métricas y al modelar los estados de carga, vacío y error. Explica cómo se aplica color en este proyecto (valor arbitrario sobre tokens CSS), que no es la forma habitual de Tailwind.
---

# Estilos y componentes — MIS Host

Sistema visual de **Financiera Confianza (MIS Host)**: PrimeNG 21 para componentes complejos accesibles, Tailwind v4 para diagramación y espaciado, y tokens CSS propios para todo el color.

---

## 1. El color se aplica por token, y Tailwind no los conoce

Esto es lo primero que hay que entender, porque es lo que distingue a este proyecto de un Tailwind típico.

La fuente de verdad es `src/app/theme/tokens.css`, que declara ~47 tokens de color `--mis-*` en `:root` y sus sobrescrituras en `.dark`. **Tailwind v4 está configurado sin bloque `@theme`**, así que esos tokens no se convierten en clases utilitarias.

Consecuencia práctica: **no existen `bg-surface-card`, `text-text-primary`, `border-border`, `bg-primary-600` ni ninguna clase semántica de ese estilo.** Escribirlas produce una pantalla sin estilos, porque Tailwind no genera nada para ellas y nadie las define.

Las dos formas correctas, ambas presentes en el repo:

```html
<!-- Valor arbitrario de Tailwind: la forma más usada -->
<p class="text-[13px] text-[var(--mis-text-secondary)]">Fecha de corte</p>
<div class="border-b" style="border-color: var(--mis-border)"></div>

<!-- style inline: cuando son varias propiedades de color juntas -->
<div class="rounded-xl border p-4"
     style="background: var(--mis-surface); border-color: var(--mis-border)">
```

Tailwind se sigue usando normalmente para **todo lo que no es color**: `flex`, `grid`, `gap-4`, `p-6`, `rounded-xl`, `text-[13px]`, `sm:flex-row`.

### Tokens de uso frecuente

| Token | Uso |
|---|---|
| `--mis-text-primary` | títulos y valores destacados |
| `--mis-text-secondary` | texto de apoyo, etiquetas |
| `--mis-text-tertiary` | metadatos, notas al pie |
| `--mis-surface` | fondo de tarjetas y contenedores |
| `--mis-panel-bg` | fondo de panel de módulo |
| `--mis-bg` | fondo de aplicación |
| `--mis-border` | divisores y bordes decorativos |
| `--mis-border-control` | borde de input o select (necesita 3:1 por WCAG 1.4.11) |
| `--mis-primary`, `--mis-primary-light`, `--mis-text-on-primary` | acción principal |
| `--mis-danger`, `--mis-success`, `--mis-warning` (+ `-light`) | estados semánticos |
| `--mis-radius-sm/md/lg/xl`, `--mis-space-1…12`, `--mis-shadow-sm/md/lg` | forma y ritmo |

Listado completo: `src/app/theme/tokens.css`. Un hex fijo en un componente lo marca el auditor (`--regla=tokens-de-color`), porque no responde al tema oscuro ni al acento que elige el usuario.

### Por qué no se saltea el token

`PreferenciasService` reescribe estos tokens en tiempo de ejecución: tema claro/oscuro, color de acento y fondo son preferencias del usuario aplicadas como variables CSS sobre `<html>`. Un color fijo se queda quieto mientras el resto de la interfaz cambia.

---

## 2. Los estados de datos

Toda vista que consuma backend modela cuatro estados, **excluyentes y en este orden**:

```html
@if (error()) {
  <app-inline-error [detalle]="error()!" (reintentar)="consultar()" />
} @else if (cargando()) {
  <app-list-skeleton />
} @else if (vacio()) {
  <app-empty-state
    titulo="Sin resultados"
    descripcion="Ajustá los filtros o la fecha de corte." />
} @else {
  <!-- contenido -->
}
```

El orden importa: **el error va primero**. Si el vacío se evalúa antes, una consulta que falló se muestra como "no hay datos" y el usuario reintenta un filtro en vez de avisar de una caída. Ese fue exactamente el defecto que degradó al sistema legado.

### Componentes de estado, ya construidos

No escribas versiones caseras. Están en `src/app/shared/ui/`, cada uno con su `README.md`:

| Componente | Contrato |
|---|---|
| `app-inline-error` | `titulo`, `detalle`, `accionLabel` (default "Reintentar"), salida `reintentar` |
| `app-empty-state` | `icono`, `titulo`, `descripcion`, `accionLabel`, salida `accion` |
| `app-list-skeleton` | `rows`, `cols` — skeleton pulsante de tabla |
| `app-loading-overlay` | superposición de carga a nivel de pantalla |

Si la pantalla delega en `app-reporte-simple`, `app-tabla-reporte`, `app-tabla-dinamica` o `app-data-table`, **esos componentes ya resuelven vacío y error por contrato**: no dupliques la lógica alrededor.

---

## 3. PrimeNG 21

El tema es un preset propio (`src/app/theme/mis-theme.ts`) construido sobre los mismos tokens `--mis-*`, con `cssLayer` ordenado como `theme, base, primeng, utilities` y sin ripple (estilo macOS). Por eso un `p-button` ya sale con la paleta corporativa: no hay que pintarlo por encima.

```html
<!-- Tablas financieras: densidad alta, montos a la derecha con cifras tabulares -->
<p-table [value]="filas()" [paginator]="true" [rows]="20" styleClass="p-datatable-sm">
  <ng-template pTemplate="body" let-fila>
    <tr>
      <td class="font-mono text-xs">{{ fila.codigo }}</td>
      <td class="text-right tabular-nums">{{ fila.montoFormateado }}</td>
      <td class="text-center"><p-tag [value]="fila.estado" [severity]="fila.activo ? 'success' : 'secondary'" /></td>
    </tr>
  </ng-template>
</p-table>

<!-- Botones -->
<p-button label="Consultar" icon="pi pi-search" />
<p-button label="Actualizar" icon="pi pi-refresh" severity="secondary" [loading]="cargando()" />
<p-button icon="pi pi-eye" [rounded]="true" [text]="true" size="small" ariaLabel="Ver detalle" />

<!-- Diálogos: siempre modales y descartables -->
<p-dialog [modal]="true" [dismissableMask]="true" [(visible)]="abierto">
```

Un diálogo se cierra al completar la acción con éxito, no antes.

---

## 4. Accesibilidad, que es contrato

- Botón icónico sin texto → `ariaLabel`.
- El error anuncia una acción de reintento comprensible; nada de volcar el mensaje crudo de un 500.
- Foco visible con `--mis-shadow-focus`, nunca solo por cambio de color.
- Tablas con encabezados reales y alineación semántica: montos a la derecha, estados centrados.
- Montos y conteos sin decimales; porcentajes y tasas conservan su precisión.
- En móvil el contenido se reduce sin cortar la etiqueta ni ocultar el valor.

---

## 5. Errores frecuentes

| Error | Consecuencia |
|---|---|
| `class="bg-surface-card text-text-primary"` | no existen: elemento sin estilo |
| `style="color: #6b7280"` | no acompaña al tema oscuro |
| Estado vacío evaluado antes que el error | una caída del backend se muestra como "sin datos" |
| Spinner propio en vez de `app-list-skeleton` | inconsistencia visual y una implementación más que mantener |
| Envolver `app-tabla-reporte` en tu propio `@if (vacio())` | doble estado vacío, uno de ellos siempre mal |
| `p-dialog` sin `[modal]` ni `[dismissableMask]` | se rompe el patrón de foco del resto del sistema |

Verificación: `node governance/scripts/validar-gobernanza.mjs --regla=tokens-de-color,estados-de-datos`
