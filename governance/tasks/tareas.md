# 🚀 Requerimiento de Refactorización: Estilos y Estructura de Tabla en Reporte de Cuenta de Resultados

## 📌 Contexto y Ubicación del Módulo
* **Ruta de la vista:** `/app/reportes/repositorio/actividad-mensual/rentabilidad/cuenta-resultados`
* **Imagen de Referencia:** `image_a63ade.jpg` (Maqueta visual estricta).

## 🎯 Objetivo General
Refactorizar la maquetación HTML/CSS en Angular de la tabla del reporte **Cuenta de Resultados (Estado de Ganancias y Pérdidas)**. Se debe implementar una estructura de encabezados multinivel (`colspan` / `rowspan`), homologar los estilos corporativos (colores, jerarquía de filas, tipografía) e integrar indicadores visuales (semáforos) exactamente como se define en la imagen de referencia.

## 📐 Ajustes Visuales Requeridos (Basados en la Imagen)

### 1. Estructura y Estilos de Encabezados (`<thead>` Multinivel)
La cabecera tiene 3 niveles de profundidad que deben agruparse con `colspan` y `rowspan`:
* **Nivel 1:** Agrupadores principales.
  * Columna 1 vacía/título (`rowspan=3`).
  * Grupo "PYG NORTE 1" (`colspan=8`).
  * Grupo "Resultado Trimestral" (`colspan=4`).
* **Nivel 2:** Años (Ej: "2025", "2026").
* **Nivel 3:** Meses, Variaciones y Trimestres (Ej: "Ago", "Jul", "Preliminar Ago", "1T - 2026").
* **Colores de Cabecera:**
  * Fondo general: Azul oscuro corporativo con texto en blanco.
  * Excepción: La columna de mes actual (ej. "Preliminar Ago") debe tener fondo **Amarillo/Mostaza** con texto en negro para destacar.
  * Bordes: Líneas finas divisorias claras/blancas entre las celdas de la cabecera.

### 2. Formato de Filas y Celdas (`<tbody>`)
* **Jerarquía de Filas (Estilos Dinámicos según la propiedad `style` o nivel):**
  * **Márgenes y Totales (Ej: MARGEN DE INTERESES, MARGEN BRUTO, MARGEN NETO):** Fila completa con fondo azul oscuro y texto en blanco (negrita).
  * **Cuentas de Detalle:** Fondo blanco o gris muy claro, con el texto de la primera columna en color gris medio y una ligera sangría (indentación) a la derecha para denotar jerarquía.
* **Alineación:**
  * Primera columna ("ESTADO DE GANANCIAS Y PERDIDAS..."): Alineada a la izquierda.
  * Todas las columnas numéricas: Alineadas a la derecha.
* **Indicadores Visuales (Semáforos):**
  * En las columnas de variación y acumulados, se debe renderizar un pequeño círculo de color (🟢 Verde o 🔴 Rojo) al lado del número según si el resultado es positivo o negativo respecto al objetivo.

## 📊 Mapeo y Formato de Datos del Backend

La estructura del payload devuelto por el servicio debe mapearse a las siguientes columnas:

| Propiedad JSON (Sugerida) | Encabezado Visual (Nivel 3) | Tipo / Formato |
| :--- | :--- | :--- |
| `style_level` / `is_total` | **ESTADO DE GANANCIAS...** | `string` / Izquierda / Indentado según jerarquía. Fila azul si es total. |
| `mes_anio_anterior` | **Ago (2025)** | `currency` / Derecha / Numérico (`#,##0`) |
| `mes_anterior` | **Jul (2026)** | `currency` / Derecha / Numérico (`#,##0`) |
| `mes_actual_preliminar` | **Preliminar Ago** | `currency` / Derecha / Numérico (`#,##0`) |
| `var_mensual_abs` | **Ago.26 vs Jul.26** | `currency` / Derecha / + Ícono Semáforo (🔴/🟢) |
| `acumulado_anio_anterior`| **Acum Ago.25** | `currency` / Derecha / Numérico (`#,##0`) |
| `acumulado_actual` | **Acum Ago.26** | `currency` / Derecha / + Ícono Semáforo (🔴/🟢) |
| `var_interanual_abs` | **Ago.26 vs Ago.25** | `currency` / Derecha / + Ícono Semáforo (🔴/🟢) |
| `var_interanual_porc` | **Ago.26 vs Ago.25 %** | `percentage` / Derecha / Formato Porcentaje (`0.00%`) |
| `trimestre_1` | **1T - 2026** | `currency` / Derecha / Numérico (`#,##0`) |
| `trimestre_2` | **2T - 2026** | `currency` / Derecha / Numérico (`#,##0`) |
| `trimestre_3` | **3T - 2026** | `currency` / Derecha / Numérico (`#,##0`) |
| `total_anual` | **TOTAL 2026** | `currency` / Derecha / Numérico (`#,##0`) |

## ✅ Criterios de Aceptación (QA)
1. **Fidelidad de Cabecera:** La tabla renderiza correctamente los agrupadores con `colspan`, manteniendo el color de fondo amarillo exclusivo para la columna de "Preliminar".
2. **Jerarquía Visual de Filas:** Las filas correspondientes a "Márgenes" (totales) se renderizan con fondo azul oscuro y letra blanca; las subcuentas tienen indentación y texto gris.
3. **Semáforos Integrados:** Las columnas de variaciones muestran correctamente el ícono circular rojo/verde junto a los valores, sin romper la alineación a la derecha.
4. **Formato de Números:** Los números se muestran en formato de miles (separador de miles, sin decimales según se ve en la imagen, excepto la columna de porcentajes que lleva 2 decimales y el símbolo `%`).
5. **Responsividad:** La estructura HTML utiliza clases modernas (`table-responsive`, flexbox/grid) permitiendo un scroll horizontal fluido de la tabla entera si la pantalla es pequeña, pero manteniendo los anchos de columna fijos y legibles.