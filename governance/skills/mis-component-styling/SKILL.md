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

Para colores derivados de las preferencias y para medir contraste, usar las funciones compartidas de `src/app/theme/color.util.ts`. `textoSobre()` no sustituye una comprobación de contraste; resolver antes las superficies translúcidas con `componerSobre()`. Seguir el procedimiento y los umbrales en [elegir y comprobar colores](../../docs/components/design-system.md#elegir-y-comprobar-colores).

### Superficies de vidrio

Para paneles, tarjetas KPI y diálogos nuevos o rediseñados, seguir la [jerarquía de vidrio adaptativo](../../docs/components/design-system.md#dirección-visual-vidrio-adaptativo) y las [guías KPI](../../docs/components/kpi-guidelines.md). `.mis-window` y `.mis-page` ya usan vidrio; `.agro-kpi` es una variante local de Cartera Agrícola diaria. No extender esa clase a otros módulos por copia. Primero comprobar contraste en ambos temas y con los fondos configurables, una superficie opaca bajo datos densos y un fondo funcional sin `backdrop-filter`.

Para botones, usar `p-button` con severidad y variante apropiadas; `MisTheme` define su forma y paleta, y `assets/styles/componentes/botones.css` su material. Los botones nativos que usan `.mis-btn` siguen ese mismo patrón. Reservar el acento para acciones principales y mantener etiqueta, foco y estado de presión; ver [botones y controles](../../docs/components/design-system.md#botones-y-controles).

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

**Con una tabla, el estado "cargando" lo pinta la propia tabla**: no se reemplaza por
`app-list-skeleton`, se le pasa `[cargando]` (o `[loading]` en `app-data-table`) y la tabla dibuja su
esqueleto dentro de su tarjeta. El error sigue yendo primero:

```html
@if (error()) {
  <app-inline-error [detalle]="error()!" (reintentar)="consultar()" />
} @else {
  <div class="mis-card p-3 overflow-x-auto">
    <app-tabla-reporte [encabezados]="tabla().headers" [filas]="tabla().body" [cargando]="cargando()" />
  </div>
}
```

`app-list-skeleton` queda para lo que no es una tabla compartida (tarjetas, listas, fichas, un
`p-table` propio). Reglas completas de las tablas: [estándar de reportes](../../docs/components/estandar-reportes.md#2-tablas).

### Componentes de estado, ya construidos

No escribas versiones caseras. Están en `src/app/shared/ui/`, cada uno con su `README.md`:

| Componente | Contrato |
|---|---|
| `app-inline-error` | `titulo`, `detalle`, `accionLabel` (default "Reintentar"), salida `reintentar` |
| `app-empty-state` | `icono`, `titulo`, `descripcion`, `accionLabel`, salida `accion` |
| `app-list-skeleton` | `rows`, `cols` — esqueleto pulsante para lo que no es una tabla compartida (las tablas traen el suyo) |
| `app-loading-overlay` | spinner global: lo maneja `LoadingService`; se corta con la primera respuesta de cada consulta |

Si la pantalla delega en `app-reporte-simple`, `app-tabla-reporte`, `app-tabla-dinamica` o `app-data-table`, **esos componentes ya resuelven carga (esqueleto) y vacío por contrato**, y el armazón también el error: no dupliques la lógica alrededor, pero sí enlazá su estado de carga real.

---

## 3. PrimeNG 21

El tema es un preset propio (`src/app/theme/mis-theme.ts`) construido sobre los mismos tokens `--mis-*`, con `cssLayer` ordenado como `theme, base, primeng, utilities` y sin ripple (estilo macOS). Por eso un `p-button` ya sale con la paleta corporativa: no hay que pintarlo por encima.

```html
<!-- Tablas: una de las compartidas, en su tarjeta, con su estado de carga. Traen densidad alta,
     resaltado de fila, alto máximo con scroll interno y esqueleto. -->
<div class="mis-card p-3 overflow-x-auto">
  <app-data-table [columns]="columnas" [data]="filas()" [loading]="cargando()" />
</div>

<!-- Botones -->
<p-button label="Consultar" icon="pi pi-search" />
<p-button label="Actualizar" icon="pi pi-refresh" severity="secondary" [loading]="cargando()" />
<p-button icon="pi pi-eye" [rounded]="true"  size="small" ariaLabel="Ver detalle" />

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
| Spinner propio, o `app-list-skeleton` en lugar de una tabla compartida | inconsistencia visual; la tabla ya pinta su esqueleto con `[cargando]`/`[loading]` |
| `[cargando]="false"` fijo o sin enlazar | la tabla nunca muestra esqueleto: "Sin datos" o filas viejas mientras carga (regla `tabla-con-esqueleto`) |
| `p-table` propio con `scrollHeight` en px o paginador fuera de la tarjeta | rompe el alto máximo y el paginador dentro de la tabla del estándar |
| Envolver `app-tabla-reporte` en tu propio `@if (vacio())` | doble estado vacío, uno de ellos siempre mal |
| `p-dialog` sin `[modal]` ni `[dismissableMask]` | se rompe el patrón de foco del resto del sistema |

Verificación: `node governance/scripts/validar-gobernanza.mjs --regla=tokens-de-color,estados-de-datos,tabla-con-esqueleto`
