# Contexto y Rol
Actúa como un **Desarrollador Senior Frontend Angular**. Tu objetivo es implementar ajustes de usabilidad, corregir problemas de maquetación/scrollbars en el Panel Unificado y Panel de Asesor, retirar componentes obsoletos y reorganizar pestañas/columnas conforme a las reglas de gobernanza en la aplicación MIS (`MIS-angular-front/`).

---

## 🚫 1. Deshabilitación de Módulos y Opciones

### Menú / Configuración
* **Acción:**
  - Deshabilitar la opción/acceso a **Configuración** en la interfaz y en el menú de navegación principal.

---

## 🐞 2. Correcciones de Módulos Específicos

### Ranking Kaypacha (Recientes)
* **Ruta / Componente:** `Ranking Kaypacha`
* **Problema:** Al ingresar desde la sección/widget de **Recientes**, se muestra el identificador/número del reporte en lugar del título o texto descriptivo.
* **Acción:**
  - Mapear adecuadamente la propiedad del nombre/título comercial del reporte al registrar o recuperar el elemento en el historial de `RecientesService`.

### Categorización (Imagen de Carga/Vacio)
* **Ruta / Componente:** `CategorizacionDashboardComponent`
* **Problema:** Cuando no existen datos disponibles, continúa mostrándose un recurso gráfico deprecado/antiguo.
* **Acción:**
  - Reemplazar la imagen obsoleta por el componente estándar `EmptyStateComponent` o la imagen de avatar/placeholder vigente en `assets/images/`.

---

## 📐 3. Ajustes de Layout y CSS en Panel de Asesor (Panel de Óscar)

### Scrollbar en Tablas (Desktop y Mobile)
* **Problema:** El desbordamiento de las tablas genera un *scrollbar* desproporcionado que rompe el diseño en resoluciones de escritorio y móviles.
* **Acción:**
  - Corregir los contenedores con `overflow-x: auto` o aplicar `[ajustarAncho]="true"` en el componente de tabla.
  - Asegurar un diseño adaptativo sin *layout shift* ni ruptura del contenedor principal.

### Estado Requisitos (Disposición en Grid)
* **Ubicación:** Sección de información de perfil del asesor.
* **Acción:**
  - Reorganizar la fila superior para estructurarla en **3 columnas**:
    - **Columna 1:** Tarjeta de Perfil del Asesor.
    - **Columna 2:** Estado de Requisitos.
    - **Columna 3:** Imagen / Ilustración.

---

## 🔄 4. Panel Unificado Asesores (Reestructuración y Retiro de Componentes)

### A. Tab de Cartera y Clientes
* **Disposición:** En el tab de **Cartera**, organizar las tablas internas para que se muestren alineadas en **2 columnas**.
* **Unificación de Componentes:** Unificar los siguientes tres bloques/tablas en una vista consolidada:
  1. `Grupos PDM`
  2. `Clientes Nuevos y Recurrentes`
  3. `Clientes Producto`
* **Retiro (*Baja*):**
  - Eliminar / Dar de baja el bloque o tabla de **Captaciones**.

---

### B. Tab de Colocación y Negocio
* **Retiro (*Baja*):**
  - Eliminar / Dar de baja el componente **Proyección Diaria**.
  - Eliminar / Dar de baja el componente **Prospecto Corresponsal**.

---

### C. Tab de Recuperación y Mora
* **Retiro (*Baja*):**
  - Eliminar / Dar de baja el componente **Cero y Una Cuota**.
  - Eliminar / Dar de baja el componente **Inversión y Stock de Mora**.

---

### D. Eliminación de Pestañas Completas
* **Retiro (*Baja*):**
  - Dar de baja y remover del renderizado el tab completo de **Movilidad y Gestión**.

---

## 🛠️ Criterios de Aceptación Técnica
1. **Limpieza de Código:** Eliminar las rutas, importaciones y llamadas a servicios asociadas a las tablas y pestañas dadas de baja para no dejar código muerto (*dead code*).
2. **Consistencia Visual:** Verificar que los cambios de columna en el Panel de Asesor utilicen CSS Grid (`grid-template-columns: repeat(3, 1fr)`) o Flexbox respetando la respuesta en dispositivos móviles (`@media (max-width: ...)`).
3. **Validación de Build:** Ejecutar `npm run build` y asegurar que no existan errores de compilación de TypeScript o dependencias rotas por la baja de componentes.