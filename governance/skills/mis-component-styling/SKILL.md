---
name: mis-component-styling
description: Estándar de diseño y componentes UI con PrimeNG 21 y Tailwind CSS v4 para Financiera Confianza MIS Host. Usar al construir interfaces, tablas con paginación, modales, formularios, tarjetas métricas y manejo de estados (cargando, vacío, error con reintento).
---

# Guía de Estilos y Componentes: PrimeNG 21 + Tailwind CSS v4 — MIS Host

El sistema de diseño de **Financiera Confianza (MIS Host)** combina **PrimeNG 21** para componentes complejos accesibles y **Tailwind CSS v4** para diagramación, espaciado y tipografía responsiva.

---

## 1. Paleta Corporativa y Clases Semánticas

El proyecto define tokens de color y superficies en `src/app/theme/tokens.css` y `src/styles.css`:

| Token Semántico | Clase Tailwind | Propósito |
|---|---|---|
| Superficie Principal | `bg-surface-ground` | Fondo de la aplicación |
| Tarjeta / Card | `bg-surface-card` | Contenedores de contenido y paneles |
| Borde General | `border-border` | Bordes sutiles y separadores |
| Texto Principal | `text-text-primary` | Títulos y valores destacados |
| Texto Secundario | `text-text-muted` | Etiquetas, placeholders y metadatos |
| Primario Corporativo | `bg-primary-600`, `text-primary-600` | Botones de acción principal, acentos |
| Peligro / Riesgo | `text-red-600`, `bg-red-50` | Alertas de error, mora crítica |
| Éxito | `text-green-600`, `bg-green-50` | Estados aprobados, al día |

---

## 2. Los 4 Estados de UI Mandatorios

Toda vista o reporte que consuma datos del backend debe implementar explícitamente los 4 estados:

1. **Estado de Carga (`cargando`)**:
   - Muestra un spinner centrado o skeletons de carga.
   - Deshabilita botones de consulta para prevenir clicks duplicados.
2. **Estado Vacío (`empty`)**:
   - Si la consulta retorna 0 registros y no hubo error, mostrar mensaje claro e instructivo con ícono amigable.
3. **Estado de Error (`error`)**:
   - Notificación de alerta visual con botón de **Reintentar**.
   - No exponer mensajes técnicos crudos de excepciones SQL o HTTP 500 al usuario.
4. **Estado de Éxito / Contenido (`ready`)**:
   - Renderiza las métricas y la tabla PrimeNG con paginación.

### Ejemplo canónico en template:
```html
<div class="p-6 space-y-6">
  <!-- Estado de Error -->
  @if (error()) {
    <div class="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <i class="pi pi-exclamation-circle text-xl"></i>
        <span>{{ error() }}</span>
      </div>
      <p-button label="Reintentar" icon="pi pi-replay" size="small" severity="danger" (onClick)="recargar()" />
    </div>
  }

  <!-- Estado de Carga -->
  @if (cargando()) {
    <div class="flex justify-center items-center py-20">
      <p-progressSpinner strokeWidth="4" />
    </div>
  } @else if (items().length === 0 && !error()) {
    <!-- Estado Vacío -->
    <div class="rounded-xl border border-dashed border-border bg-surface-ground p-12 text-center">
      <i class="pi pi-folder-open text-4xl text-text-muted mb-3"></i>
      <h3 class="text-base font-semibold text-text-primary">No se encontraron datos</h3>
      <p class="text-sm text-text-muted mt-1">Ajuste los filtros de búsqueda o verifique la fecha de corte.</p>
    </div>
  } @else {
    <!-- Estado Contenido / Tabla -->
    <div class="rounded-xl border border-border bg-surface-card overflow-hidden shadow-sm">
      <p-table [value]="items()" [paginator]="true" [rows]="10" styleClass="p-datatable-sm">
        <!-- columnas -->
      </p-table>
    </div>
  }
</div>
```

---

## 3. Uso Estándar de Componentes PrimeNG

### Tablas de Reporte (`p-table`)
- Utilizar `styleClass="p-datatable-sm"` para maximizar la densidad de información en pantallas financieras.
- Alinear montos financieros a la derecha (`class="text-right font-medium font-mono"`).
- Centrar tags y estados (`class="text-center"`).

### Botones (`p-button`)
- Botón principal: `<p-button label="Guardar" icon="pi pi-check" severity="primary" />`
- Botón secundario: `<p-button label="Cancelar" severity="secondary" />`
- Botón de exportación: `<p-button label="Descargar Excel" icon="pi pi-file-excel" severity="success" />`
- Botón de acción en tabla: `<p-button icon="pi pi-eye" [rounded]="true" [text]="true" size="small" />`

### Modales y Diálogos (`p-dialog`)
- Configurar siempre `[modal]="true"` y `[dismissableMask]="true"`.
- Los formularios dentro del modal deben emitir eventos limpios y cerrar el modal únicamente al completar la acción con éxito.
