# 🚀 Requerimiento de Refactorización: Estilos de Tabla en Reporte de Cuenta de Resultados

---

## 📌 Contexto y Ubicación del Módulo
* **Ruta de la vista:** `/app/reportes/repositorio/actividad-mensual/rentabilidad/cuenta-resultados`
* **Imagen de Referencia:** `governance/tasks/image.png` (Ubicada en el repositorio local).

---

## 🎯 Objetivo General
Refactorizar la maquetación CSS y el maquetado HTML/Angular de la tabla del reporte **Cuenta de Resultados** para homologar su diseño visual (dimensiones, jerarquía de encabezados, paddings y proporciones de columnas) con el estándar visual definido en la imagen de referencia.

---

## 📐 Ajustes Visuales Requeridos (Basados en la Imagen de Referencia)

### 1. Estructura y Estilos de Encabezados (`<thead>`)
* **Proporciones y Alturas:** Reducir la altura vertical (*padding*) de la cabecera para mantener un diseño compacto.
* **Alineación y Tipografía:**
  * Alineación a la izquierda para columnas de códigos/descripciones (`cuenta_codigo`, `cuenta_nombre`).
  * Alineación a la derecha para columnas numéricas de importes y variaciones.
* **Tokens de Color:** Aplicar los estilos cromáticos corporativos a las filas de la cabecera según las normas del *Design System* del proyecto.

### 2. Formato e Indentación de Celdas (`<tbody>`)
* **Jerarquía Tipográfica (Estilos Dinámicos):**
  * La propiedad `style` de la data de respuesta definirá la jerarquía visual de la fila (p. ej., negrita para subtotales/totales o fuentes normales para cuentas de detalle).
* **Dimensiones y Espaciado:**
  * Ajustar el ancho relativo de las columnas para evitar la aparición de barras de desplazamiento horizontal (*scrollbars*) innecesarias.
  * Habilitar el truncado o ajuste de texto en la columna `cuenta_nombre` si excede el ancho disponible.

---

## 📊 Mapeo y Formato de Datos del Backend

A continuación se detalla la estructura del payload devuelto por el servicio para el mapeo correcto en las columnas de la tabla:

| Propiedad JSON | Encabezado Visualmente Requerido | Tipo de Dato | Formato / Alineación |
| :--- | :--- | :--- | :--- |
| `style` | *(Estilo de la Fila)* | `number` | Controla negritas, sangrías o color de fila |
| `cuenta_codigo` | **Código** | `string` | Izquierda |
| `cuenta_nombre` | **Nombre de Cuenta** | `string` | Izquierda |
| `orden` | *(Ordenamiento)* | `number` | Lógica interna / Oculto |
| `periodo_anio_anterior` | **P. Año Anterior** | `currency` | Derecha / Formato Numérico (`#,##0.00`) |
| `periodo_anterior` | **P. Anterior** | `currency` | Derecha / Formato Numérico (`#,##0.00`) |
| `periodo_actual` | **P. Actual** | `currency` | Derecha / Formato Numérico (`#,##0.00`) |
| `variacion_periodo_anterior` | **Var. P. Anterior** | `currency` | Derecha / Formato Numérico con resalte de signo |
| `acumulado_anio_anterior` | **Acum. Año Anterior** | `currency` | Derecha / Formato Numérico (`#,##0.00`) |

---

## ✅ Criterios de Aceptación (QA)
1. **Fidelidad Visual:** Las dimensiones de celdas, bordes, rellenos (*padding*) y colores de la tabla coinciden exactamente con la maqueta entregada en `governance/tasks/image.png`.
2. **Formato Monetario:** Todos los importes numéricos deben mostrarse formateados a dos decimales y alineados a la derecha.
3. **Soporte `style`:** Las filas de resultados finales o subtotales aplican correctamente el estilo visual en negrita/resaltado según la propiedad `style` del objeto de respuesta.
4. **Responsive / Sin Scroll Innecesario:** La tabla se adapta al ancho útil del panel sin generar *scrollbars* horizontales forzadas en resoluciones estándar.