# Contexto y Rol
Actúa como un **Desarrollador Senior Frontend Angular**. Tu objetivo es realizar refactorizaciones de componentes, corregir errores de renderizado/CORS/servicios, ajustar estilos CSS/Layout y unificar elementos visuales conforme a las reglas de gobernanza en la aplicación MIS (`MIS-angular-front/`).

---

## 🎨 1. Componentes Visuales: KPIs y Chips

### Monitor Desembolsos Misionales
* **Ruta:** `/app/reportes/leg/com/rda/adm/mon-desem-misi`
* **Acción:**
  - Reemplazar los componentes KPI actuales por componentes de tipo **Chip** (`ChipInformativoComponent` o similar según la guía de diseño en `governance/components/`).
  - Aplicar la paleta de colores y tokens CSS estándar definidos en el manual de gobernanza para los chips de reportes.

### Cartera por Producto (Formato de Números)
* **Ruta:** `/app/reportes/leg/com/rma/adm/cart-prod`
* **Acción:**
  - **KPIs:** Configurar los formateadores numéricos para remover decimales (mostrar solo enteros o valores redondeados según corresponda).
  - **Gráficos (Sección Real):** Ajustar las etiquetas e indicadores del valor "Real" en los gráficos para omitir decimales.

---

## 📐 2. Estilos, Layout y Ancho de Columnas

### Productos Misionales (Truncado de Texto)
* **Ruta:** `/app/reportes/repositorio/actividad-diaria/prod-misionales/productos-misionales`
* **Acción:**
  - En la **tabla de asesores**, evitar la superposición de texto en celdas estrechas.
  - Implementar *text-overflow/ellipsis* (`...`) mediante CSS o clase compartida (`text-truncate` / `overflow-hidden white-space-nowrap text-ellipsis`) con un tooltip nativo/custom al pasar el mouse si el texto es extenso.

### Reducción de Ancho de Columnas (Fit a Pantalla)
* **Rutas:**
  - `/app/reportes/leg/com/rma/adm/capta-caract-canal-comercial-m`
  - `/app/reportes/repositorio/actividad-mensual/cartera/estructura-desembolsos`
* **Acción:**
  - Ajustar porcentajes o anchos máximos (`max-width` / `width`) de las columnas para evitar que la tabla fuerce un scrollbar horizontal innecesario.

---

## 📑 3. Estructura y Navegación por Tabs

### Datos Producto Mensual
* **Ruta:** `/app/reportes/leg/com/rma/adm/dat-prod-men`
* **Acción:**
  - Organizar las múltiples tablas en una interfaz basada en **Pestañas (Tabs)** para mejorar la legibilidad del usuario.

### Monitor de Efectividades (Migración de Tabs)
* **Rutas:**
  - `/app/reportes/leg/com/rma/adm/mon-efec`
  - `/app/reportes/leg/com/rma/adm/mon-efec-reasig`
* **Acción:**
  - Revisar el sistema *Legacy* e implementar la pestaña faltante: **"Detalle de Efectividades"**.
  - Asegurar que la pestaña "Detalle de Efectividades" incluya sus **filtros propios** específicos según el comportamiento original.

---

## ⌛ 4. Carga Asíncrona, Skeletons y Estado Cero

### Agro Mix Mensual (Skeletons en Gráficos)
* **Ruta:** `/app/reportes/repositorio/actividad-mensual/cartera/agro-mix-m`
* **Acción:**
  - Reemplazar la etiqueta de texto plano *"Cargando gráficos de detalle..."* por componentes **Skeleton Loader** visuales alineados con el tamaño de los gráficos.
  - Extender esta regla a cualquier otro bloque/gráfico de la vista que requiera indicación de carga.

### Uso Comercial Mensual (Tablero Digital)
* **Ruta:** `/app/reportes/repositorio/actividad-mensual/tab-digital/usa-come-m`
* **Acción:**
  - Implementar el estado de carga con **Skeleton** para la tabla principal.
  - Corregir el flujo de datos para que la tabla se renderice adecuadamente al recibir la respuesta del backend.

---

## 🛠️ 5. Migración de Reportes y Corrección de Errores de Servicio

### Contratación Electrónica Mensual
* **Ruta:** `https://stg.confianza.pe/app/reportes/leg/com/rma/adm/cont-elect-m`
* **Acción:**
  - Comparar contra la versión *Legacy* e identificar la tabla omitida.
  - Mapear el contrato de datos e integrar la tabla faltante dentro del maquetado del reporte.

### Monitor de Efectividades (Error 500 / Fallo de Carga)
* **Ruta:** `/app/reportes/leg/com/rma/adm/mon-efec`
* **Acción:**
  - Diagnosticar la falla al cargar el reporte (*"No se pudo cargar el reporte. Inténtalo de nuevo en unos segundos"*).
  - Verificar en Network/DevTools si es un fallo de parámetros en el endpoint de Winder/REST o una falta de mapeo en el service.

### Gráfico de Cosechas (Error de Carga)
* **Ruta:** `/app/reportes/leg/com/rma/adm/graf-cosechas`
* **Acción:**
  - Corregir el fallo en la llamada/servicio del reporte tomando como referencia la especificación del *Legacy*.

### Gestión de Cartera Reasignada Mes (Pendiente de Migración)
* **Ruta:** `/app/reportes/leg/com/rma/adm/gest_cart_her`
* **Ubicación en Menú:** *Reportes > Actividad Mensual > Cartera en Mora > Gestión de Cartera Reasignada Mes*
* **Acción:**
  - Realizar la migración completa del reporte desde el sistema *Legacy*.

---

## 🔄 6. Refactorización de Tablas y Maquetado de Filtros

### Gestión de Cartera
* **Rutas:**
  - `/app/reportes/leg/com/rda/adm/gest_cart_her`
  - `/app/reportes/leg/com/rma/adm/gest_cart_her-flujo`
* **Acción:**
  - **Detalle de Tabla:** Corregir la falla que impide mostrar las filas/detalles de la tabla basándose en el *Legacy*.
  - **Refactorización:** Reestructurar los datos mediante `TablaDinamicaComponent` o `TablaReporteComponent`.
  - **Tabs (en `gest_cart_her-flujo`):** Dividir las secciones en pestañas navegables.
  - **Disposición de Filtros Propios:** Reorganizar los controles para que no queden apilados verticalmente. Disponer **"Mostrar por"** y **"Fecha Cierre"** de forma horizontal (lado a lado / flexrow) utilizando `GrupoFiltrosComponent` o estilos en grid.

---

## 🚀 Criterios de Aceptación Técnica
1. **Consistencia de UI:** Garantizar que los colores, fuentes y botones sigan los tokens CSS de `src/app/theme/tokens.css`.
2. **Sin Romper Zoneless:** Asegurar que las actualizaciones de vistas con tabs o filtros reactivos refresquen el DOM correctamente sin depender del mecanismo legacy de ChangeDetection.
3. **Build Verde:** Validar compilación limpia mediante `npm run build` y ejecución de tests locales (`npm test`).