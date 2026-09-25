# Contexto y Rol
Actúa como un **Desarrollador Senior Frontend Angular**. Tu objetivo es implementar una nueva regla de carga independiente (*asynchronous progressive loading*) para tablas y corregir errores visuales, de rendimiento, paginación, notas informativas y *drill-down* según los estándares de Gobernanza del proyecto MIS (`MIS-angular-front/`).

---

## 🚨 NUEVA REGLA GLOBAL DE UX / LOADING SPINNER

* **Comportamiento Actual:** Un *loading spinner* global o de panel bloquea la visualización completa de la sección hasta que la última tabla o recurso termina de responder.
* **Nuevo Requerimiento (Carga Independiente por Sección/Tabla):**
  1. Tan pronto como **la primera tabla o bloque cargue sus datos**, el *loading spinner* general del panel/página **debe desactivarse**, permitiendo al usuario visualizar e interactuar con la información disponible.
  2. Cada tabla o bloque secundario que continúe en proceso de carga debe manejar su propio **spinner local o esqueleto de carga (*skeleton loader*)** en su contenedor específico.
  3. **Objetivo:** Prevenir que el retraso de una API o tabla secundaria bloquee la renderización y consulta de las demás tablas del reporte.

---

## 📋 Lista de Tareas Específicas por Ruta / Componente

### 1. Seguros Comerciales (Drill-Down)
* **Ruta:** `/app/reportes/repositorio/actividad-diaria/seguro/seguro-com`
* **Acción:**
  - Leer la documentación de gobernanza ubicada en `governance/` referente a interacción e hipervínculos.
  - Implementar el comportamiento de **Drill-Down** en las celdas/filas correspondientes para permitir la profundización de datos.

### 2. Agendamiento de Campañas (Rendimiento y Paginación)
* **Ruta:** `/app/reportes/repositorio/actividad-diaria/campanias/agendamiento`
* **Acción:**
  - **Optimización:** Investigar y corregir la causa por la cual la pantalla se congela/colapsa al cargar (revisar renderizado masivo en DOM, ciclos de cambio o loops en subscriptores).
  - **Comparativa Legacy:** Verificar el comportamiento del sistema *Legacy*.
  - **Paginación:** Validar e implementar componentes de paginación en las tablas para segmentar la carga de registros.

### 3. Reporte de Clientes (Ajuste de Layout)
* **Ruta:** `/app/reportes/leg/com/rda/adm/cli`
* **Acción:**
  - Reducir el ancho (*width*) de las columnas de la tabla de forma proporcional.
  - Prevenir la aparición del *scrollbar* horizontal en resoluciones estándar de escritorio.

### 4. Proyecciones M1 (Ajuste de Layout)
* **Ruta:** `/app/reportes/leg/com/rda/adm/proy_M1`
* **Acción:**
  - Ajustar y optimizar el ancho de las columnas.
  - Eliminar el desbordamiento horizontal (*horizontal overflow / scrollbar*).

### 5. Uso de Aplicativo Móvil (Ubicación de Leyendas)
* **Ruta:** `/app/reportes/leg/com/rda/adm/app_uso`
* **Acción:**
  - Reubicar los siguientes textos informativos para que aparezcan **encima (antes) de la tabla** y no en la parte inferior:
    > `* Toda la información presentada en el siguiente cuadro considera solo las instancias y etapas de flujo de credito incluyendo comite de crédito por el aplicativo móvil (excluye Bantotal).`  
    > `** El reporte considera las instancias ingresadas en el mes en curso vs el total de cada etapa del flujo crediticio ingresadas.`

### 6. Uso Comercial - Tablero Digital (Corrección de Renderizado)
* **Ruta:** `/app/reportes/repositorio/actividad-diaria/tab-digital/usa-come`
* **Acción:**
  - Comparar con la vista *Legacy*.
  - Corregir el fallo donde la tabla no se muestra (verificar la llamada al servicio, estructura de respuesta del modelo JSON o banderas de `@if` / `*ngIf`).

### 7. Banca Solidaria (Drill-Down)
* **Ruta:** `/app/reportes/repositorio/actividad-diaria/cartera/banca-solidaria`
* **Acción:**
  - Revisar y corregir la navegación e hipervínculos de **Drill-Down** para que coincidan con la lógica de jerarquía y detalle de negocio.

### 8. Resumen Movilidad (Paginador)
* **Ruta:** `/app/reportes/leg/com/rda/adm/res-mov`
* **Acción:**
  - Integrar e implementar el **paginador de tabla** para estar alineados con el estándar del sistema *Legacy*.

### 9. Resumen Movilidad Recuperaciones (Paginador)
* **Ruta:** `/app/reportes/leg/com/rda/adm/res-mov-rec`
* **Acción:**
  - Integrar e implementar el **paginador de tabla** acorde a la interfaz *Legacy*.

---

## 🛠️ Criterios de Aceptación Técnica
1. **Patrón Zoneless / Signals:** Asegurar que los cambios de estado de carga individuales (`isLoadingTableA`, `isLoadingTableB`) se gestionen mediante Signals o RxJS sin provocar re-renders innecesarios.
2. **Componente Reutilizable:** Emplear `TablaDinamicaComponent` o `TablaReporteComponent` (`src/app/shared/ui/tablas/`) asegurando que soporten paginación nativa y *spinners* o esqueletos por componente.
3. **Calidad y Estabilidad:** Garantizar que las vistas no bloqueen el hilo principal del navegador (*UI freezing*) y superen las pruebas estáticas (`npm run build`) y de e2e.