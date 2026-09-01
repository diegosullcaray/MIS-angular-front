# Guía de Estilo y Patrón de Implementación: Tarjetas KPI / Métricas

Este documento define el estándar visual, técnico y de accesibilidad para la construcción de **Tarjetas KPI (Key Performance Indicators)** en el portal MIS Host (aplicable a Actividad Diaria, Actividad Mensual, Dashboards, Módulo Analista y otros módulos).

---

## 1. Principios de Diseño

1. **Jerarquía Visual Clara:**
   - **Etiqueta Superior:** Nombre conciso de la métrica en texto pequeño, seminegrita y en mayúsculas (`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--mis-text-tertiary)]`).
   - **Valor Central:** Dato numérico principal de alto impacto con números tabulares y tipografía destacada (`text-[20px] sm:text-[24px] font-extrabold tracking-tight text-[var(--mis-text-primary)]`).
   - **Metadato Comparativo:** Contexto de comparación (ej. meta, mes anterior, tasa mínima) en texto secundario (`text-[11px] sm:text-[12px] font-medium text-[var(--mis-text-secondary)]`).
2. **Soporte Nativo de Temas (Light & Dark Mode):**
   - Las tarjetas y sus elementos gráficos **nunca** deben usar colores fijos (como `#ffffff` o `#000000`) en fondos o textos.
   - Deben utilizar exclusivamente los **tokens CSS del Design System** (`--mis-surface`, `--mis-border`, `--mis-text-primary`, `--mis-success-light`, etc.).
3. **Comportamiento Responsivo:**
   - En pantallas móviles (`< 640px`): Las tarjetas se apilan a 1 columna o 2 columnas compactas.
   - En pantallas medianas (`640px` - `1279px`): Grid de 2 columnas.
   - En pantallas de escritorio (`≥ 1280px`): Grid de 4 columnas (`xl:grid-cols-4`).
   - Contenedores flexibles con `min-w-0` y `truncate` para evitar rupturas de layout.

---

## 2. Tipos de Indicadores Visuales

### A. Indicador de Cumplimiento / Meta (Knob Circular)
Utilizado para métricas con una meta fija o porcentaje de cumplimiento (ej. *Monto Desembolsado*, *Operaciones Desembolsadas*, *Captaciones*).

- **Componente:** `p-knob` de PrimeNG.
- **Configuración recomendada:**
  - `[size]="54"`
  - `[strokeWidth]="6"`
  - `[readonly]="true"`
  - `valueTemplate="{value}%"`
  - `textColor="var(--mis-text-primary)"`
  - `rangeColor="var(--mis-border)"`
- **Regla de Color Dinámico (`colorAnillo`):**
  - $< 95\%$: `var(--mis-danger)` (Rojo)
  - $95\% - 100\%$: `var(--mis-warning)` (Ámbar)
  - $> 100\%$: `var(--mis-success)` (Verde)

### B. Indicador de Variación / Tendencia (Trend Badge con Flechas Verde/Roja)
Utilizado para métricas con comparación temporal o diferencial de tasas/saldos (ej. *TAPP Mes / TAPP Mínima*, *Saldo Medio Vigente vs. Mes Anterior*).

- **Positivo / Favorable ($\ge 0$):**
  - Fondo: `var(--mis-success-light)`
  - Texto e Ícono: `var(--mis-success)`
  - Borde: `1px solid var(--mis-success)`
  - Flecha hacia arriba: `▲` / SVG `line x1="12" y1="19" x2="12" y2="5"` + `polyline points="5 12 12 5 19 12"`
- **Negativo / Desfavorable ($< 0$):**
  - Fondo: `var(--mis-danger-light)`
  - Texto e Ícono: `var(--mis-danger)`
  - Borde: `1px solid var(--mis-danger)`
  - Flecha hacia abajo: `▼` / SVG `line x1="12" y1="5" x2="12" y2="19"` + `polyline points="19 12 12 19 5 12"`

---

## 3. Modelo de Datos Recomendado (`TarjetaKpi`)

```typescript
export interface TarjetaKpi {
  /** Nombre del indicador (ej. "TAPP Mes / TAPP Mínima"). */
  etiqueta: string;
  /** Valor numérico o string formateado (ej. 25430, "36.27 %"). */
  valor: number | string;
  /** Texto contextual secundario (ej. "Meta 28,000", "Mínima 41.61 %"). */
  comparativo?: string;
  /** Dirección de la señal: 1 = sube/favorable, -1 = baja/desfavorable, 0 = neutro. */
  senal?: number;
  /** Texto delta junto a la flecha (ej. "+534 pbs", "-6,220"). */
  delta?: string;
  /** Porcentaje de cumplimiento para dibujar el anillo de progreso en vez del badge. */
  cumplimiento?: number;
}
```

---

## 4. Plantilla HTML Estándar

```html
<section class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 w-full">
  @for (tarjeta of tarjetas(); track tarjeta.etiqueta) {
    <div class="kpi-card p-3.5 sm:p-4 rounded-xl sm:rounded-2xl flex items-center justify-between gap-2.5 sm:gap-3">
      <!-- Lado izquierdo: Textos y cifras -->
      <div class="flex flex-col gap-1 min-w-0 flex-1">
        <span class="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--mis-text-tertiary)] truncate">
          {{ tarjeta.etiqueta }}
        </span>

        <span class="text-[20px] sm:text-[24px] font-extrabold tracking-tight text-[var(--mis-text-primary)] leading-tight truncate">
          @if (isNumeroFinito(tarjeta.valor)) {
            {{ +tarjeta.valor | number: '1.0-2' }}
          } @else {
            {{ tarjeta.valor }}
          }
        </span>

        @if (tarjeta.comparativo) {
          <span class="text-[11px] sm:text-[12px] font-medium text-[var(--mis-text-secondary)] truncate">
            {{ tarjeta.comparativo }}
          </span>
        }
      </div>

      <!-- Lado derecho: Knob circular o Trend Badge -->
      @if (tarjeta.cumplimiento !== undefined) {
        <div class="flex items-center justify-center shrink-0">
          <p-knob
            [ngModel]="valorAnillo(tarjeta)"
            [readonly]="true"
            [size]="54"
            [strokeWidth]="6"
            [valueColor]="colorAnillo(valorAnillo(tarjeta))"
            rangeColor="var(--mis-border)"
            textColor="var(--mis-text-primary)"
            valueTemplate="{value}%"
          />
        </div>
      } @else if (tarjeta.delta) {
        <div
          class="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold shrink-0 shadow-sm transition-all"
          [class.trend-badge-positive]="(tarjeta.senal ?? 0) >= 0"
          [class.trend-badge-negative]="(tarjeta.senal ?? 0) < 0"
        >
          @if ((tarjeta.senal ?? 0) >= 0) {
            <svg class="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="19" x2="12" y2="5"></line>
              <polyline points="5 12 12 5 19 12"></polyline>
            </svg>
          } @else {
            <svg class="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <polyline points="19 12 12 19 5 12"></polyline>
            </svg>
          }
          <span>{{ tarjeta.delta }}</span>
        </div>
      }
    </div>
  }
</section>
```

---

## 5. Estilos CSS Reutilizables

```css
:host {
  display: block;
  width: 100%;
}

.kpi-card {
  position: relative;
  overflow: hidden;
  background: var(--mis-surface);
  border: 1px solid var(--mis-border);
  box-shadow: var(--mis-shadow-sm);
  transition: transform var(--mis-transition-base), box-shadow var(--mis-transition-base), border-color var(--mis-transition-base);
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--mis-shadow-md);
  border-color: var(--mis-border-strong);
}

.kpi-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, var(--mis-primary), transparent);
  opacity: 0;
  transition: opacity var(--mis-transition-fast);
}

.kpi-card:hover::before {
  opacity: 1;
}

/* Badges semánticos para Light y Dark Mode */
.trend-badge-positive {
  background-color: var(--mis-success-light);
  color: var(--mis-success);
  border: 1px solid var(--mis-success);
}

.trend-badge-negative {
  background-color: var(--mis-danger-light);
  color: var(--mis-danger);
  border: 1px solid var(--mis-danger);
}
```

---

## 6. Checklist de Validación

Al implementar o migrar un nuevo reporte con KPIs, verificar:
- [x] **Tokens Dark Mode:** La tarjeta usa `var(--mis-surface)` y no blancos fijos.
- [x] **Flechas de Tendencia:** Se muestran flechas verdes hacia arriba para valores positivos/favorables y flechas rojas hacia abajo para valores negativos.
- [x] **Deltas y Puntos Básicos:** Si la métrica compara tasas porcentuales, el delta se expresa en puntos básicos (`pbs`) y con signo explícito (`+534 pbs` / `-534 pbs`).
- [x] **Knob Circular:** El color del texto es legible en Dark Mode (`textColor="var(--mis-text-primary)"`) y el aro de fondo usa `rangeColor="var(--mis-border)"`.
- [x] **Responsividad:** El grid y el contenido se adaptan a resoluciones móviles (desde 360px de ancho) sin romper la estructura.
