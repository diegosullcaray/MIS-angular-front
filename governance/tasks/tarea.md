# 🚀 Requerimientos de Refactorización y Correcciones - MIS Angular

---

## 📌 1. Shell Layout & Navegación

* **Breadcrumb sin click para retroceder:** 
  * Eliminar la funcionalidad del evento `click` que regresa a la pantalla anterior en los componentes de *Breadcrumbs*. 
  * La navegación/retorno ya se gestiona desde el botón centralizado dentro de los paneles. El *breadcrumb* quedará puramente como un indicador de ruta estático.
* **Corrección de Indexación de Rutas (Error 404):** 
  * Revisar y corregir la indexación dinámica de navegación/menú para asegurar que los links apunten a las rutas válidas y evitar pantallas de error 404.

---

## 📌 2. Módulo Kaypacha (`/app/Kaypacha__`)

* **Eliminar Input de Buscador:**
  * Remover el `<input>` de búsqueda manual ubicado en la cabecera del diálogo.
* **Uso de Tabla Compartida (`Shared DataTable`):**
  * Reemplazar la tabla actual del diálogo por el componente compartido (`shared`), el cual integra nativamente el filtrado individual por columnas.

---

## 📌 3. Estándar Global para Tablas en Paneles

* **Eliminación de Scrollbar Horizontal:**
  * Ajustar el diseño e integración CSS para reducir las dimensiones e impedir la aparición no deseada de scrollbar horizontal siempre que sea posible.
* **Salto de Línea en Encabezados:**
  * Configurar `white-space: normal` y ruptura de palabras en los encabezados de columna para reducir el ancho ocupado por nombres de tabla muy largos.

---

## 📌 4. Módulo Actividades - Destino de Crédito (`/app/actividades/dest-credito`)

* **Corrección del Filtro de Asesores/Colaboradores:**
  * Revisar la lógica del *Legacy*.
  * En la versión actual se está aplicando el filtro erróneamente sobre la data local de la tabla. Se debe corregir para que consulte/filtre correctamente a los colaboradores según la jerarquía establecida.

---

## 📌 5. Módulo Presupuesto (Líneas y Gestión)

> **Rutas impactadas:**
> * `/app/presupuesto/lineas/activos/car-cre`
> * `/app/presupuesto/lineas/pasivos-patrimonio/car-dep-red`
> * `/app/presupuesto/lineas/pasivos-patrimonio/car-dep-bp`
> * `/app/presupuesto/lineas/pasivos-patrimonio/seg-com`
> * `/app/presupuesto/lineas/pasivos-patrimonio/seg-ope`
> * `/app/presupuesto/gestion/seguimiento/tbl-ver`

* **Color y Proporciones de Tablas:**
  * Homologar los colores de la tabla con los tokens cromáticos definidos en el sistema.
  * Reajustar el ancho y proporciones relativas de las celdas/columnas.
* **Alineación del Botón "Verificar":**
  * Ubicar el botón "Verificar" alineado a la derecha en la misma línea del *header* de las pestañas (*tabs*).

---

## 📌 6. Módulo Analista - Categorización (`/app/analista/categorizacion`)

### A. Selector de Asesores
* **Despliegue Automático por Rol:**
  * Si el usuario autenticado tiene rol de **Coordinador** o **Administrador**, desplegar el diálogo modal selector de asesor al ingresar (tal como en *Legacy*).
* **Integración de Tabla Shared en Modal:**
  * Reemplazar la grilla del modal por la tabla compartida de *Shared* con filtros por columna.
  * Restablecer la totalidad de columnas requeridas según la definición del módulo *Legacy*.

### B. Layout, Perfil y Tooltip "Baby Pachi"
* **Ampliación a Pantalla Completa (Full Screen):**
  * Al hacer clic en el botón de maximizar/ampliar pantalla, la vista debe abarcar todo el *layout* global (sobreponiéndose a la barra lateral y cabecera) y no quedarse limitada al panel interno.
* **Tooltip en Avatar de "Baby Pachi":**
  * Cambiar la visualización del globo de texto para que aparezca únicamente en el evento `hover` (Tooltip sobre el cursor) y no de forma permanente.
* **Tarjeta de Perfil:**
  * Rediseñar la tarjeta de perfil mejorando la maquetación CSS, espaciados y jerarquía visual.