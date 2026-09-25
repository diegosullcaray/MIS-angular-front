# Contexto y Rol
Actúa como un **Desarrollador Senior en Angular** encargado de corregir inconsistencias visuales, migrar reportes faltantes e integrar reglas de UI/Gobernanza respecto al sistema *Legacy* dentro de la estructura de la aplicación (`src/app/modules/reportes/...`).

---

## 🎯 Objetivo General
Corregir los errores de color, paginación, notas pie de página, migración de módulos y comportamiento de *drill-down* especificados para cada una de las URLs detalladas a continuación.

---

## 📋 Lista de Tareas por Ruta / Componente

### 1. Estructura Desembolsos
* **Ruta:** `/app/reportes/repositorio/actividad-diaria/cartera/estructura-desembolsos`
* **Acción:**
  - Corregir los colores de la **última fila** (Totales/Resumen) de la tabla.
  - Alinear los colores exactamente a la paleta corporativa y/o de tokens CSS utilizada en el sistema *Legacy*.

### 2. Saldo Puntual de Cartera
* **Ruta:** `/app/reportes/leg/com/rda/adm/saldo`
* **Acción:**
  - Agregar la nota informativa o leyenda explicativa justo debajo de la tabla **"Saldo puntual de cartera vigente"**:
    > `*Considerar que los saldos de cartera no incluyen los ajustes de traslados GECO que se realizarán para el pago del REVA.`

### 3. Monitor Retenciones (Drill-Down)
* **Ruta:** `/app/reportes/repositorio/actividad-diaria/cartera/mon-retenciones`
* **Acción:**
  - Revisar las directrices documentadas en `governance/` sobre interacción e hipervínculos (*drill-down*).
  - Implementar la funcionalidad de **Drill-Down** correspondiente en las celdas/filas del reporte para permitir la navegación/profundización de datos.

### 4. Gestión Comercial (Migración de Reporte)
* **Ruta:** `/app/reportes/repositorio/actividad-diaria/cartera/gest-comercial`
* **Acción:**
  - Realizar la migración del reporte desde el sistema *Legacy*.
  - Mapear las columnas, cálculos, tarjetas y filtros respetando la lógica de negocio y presentación del reporte original.

### 5. Portafolio Agro
* **Ruta:** `/app/reportes/leg/com/rda/adm/port-agro`
* **Acción:**
  - Agregar los identificadores de unidad/moneda en las cabeceras o subtítulos del reporte:
    - **Expresado en PEN**
    - **%**

### 6. Desembolsos Diarios
* **Ruta:** `/app/reportes/leg/com/rda/adm/desem-dia`
* **Acción:**
  - Colocar la siguiente nota explicativa debajo de la tabla **"Desembolsos habilitados para posible contratación electrónica*"**:
    > `* Créditos individuales hasta S/. 20 mil`

### 7. Autonomía de Tasas
* **Ruta:** `/app/reportes/leg/com/rda/adm/aut-tasa`
* **Acción:**
  - Revisar las tablas del reporte *Legacy*.
  - Completar e incluir todas las notas informativas, leyendas y pies de tabla faltantes en **todas** las tablas de este reporte.

### 8. Resultados Incentivos PDM
* **Ruta:** `/app/reportes/leg/com/rda/adm/res-inc_pdm`
* **Acción:**
  - **Color de columnas:** Corregir para utilizar un color único correspondiente al token/custom theme global del sistema.
  - **Paginador:** Implementar el paginador idéntico al que posee la versión *Legacy*.

### 9. Desembolso Crédito
* **Ruta:** `/app/reportes/leg/com/rda/adm/des-cred`
* **Acción:**
  - Corregir el estilo de texto en la columna con fondo verde: cambiar el color de la tipografía/letra a **blanco (`#FFFFFF`)** para asegurar un contraste accesible.

### 10. Detalle Incentivos PDM
* **Ruta:** `/app/reportes/leg/com/rda/adm/det-ince-pdm`
* **Acción:**
  - **Colores:** Eliminar los colores rojos de las columnas y unificar según el estándar/custom theme del proyecto.
  - **Paginador:** Incluir el paginador correspondiente emulando la funcionalidad *Legacy*.

---

## 🛠️ Criterios de Aceptación Técnica
1. **Tokens CSS:** Utilizar los tokens centralizados definidos en `src/app/theme/tokens.css` para aplicar los colores del sistema sin harcodear estilos in situ siempre que sea posible.
2. **Componentes Compartidos:** Reorganizar o reutilizar los componentes de `TablaDinamicaComponent` o `TablaReporteComponent` ubicados en `src/app/shared/ui/tablas/` para paginación y notas pie de página.
3. **Compilación y Tests:** Asegurar que la aplicación compile sin errores de TypeScript y que las pruebas asociadas a la ruta ejecuten correctamente (`npm run test` o comandos Playwright en `/e2e`).