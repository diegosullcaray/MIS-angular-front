# Requerimiento de Ajustes: Panel de Cuenta de Resultados

**URL del panel:** `http://localhost:4200/app/reportes/repositorio/actividad-mensual/rentabilidad/cuenta-resultados`

**Ruta de los archivos del componente:**
`src/app/pages/modules/reportes/components/actividad-mensual/components/Rentabilidad/items/cuenta-resultados/`

## 📋 Tareas a realizar

- [ ] **1. Implementar estado de carga (Loading / Skeleton)**
  - Al ingresar por primera vez al panel, no se muestra el `load spinner` ni el componente `skeleton`. 
  - Ajustar el componente aplicando las reglas de gobernanza del proyecto para que muestre la animación de carga correcta antes de renderizar la data.

- [ ] **2. Ocultar columna "Resultado Trimestral"**
  - En la tabla principal, ocultar o eliminar la configuración de la columna `resultado trimestral`, ya que se solicitó explícitamente no mostrarla.

- [ ] **3. Habilitar Drill-Down en "Estado de Ganancia"**
  - Configurar la data de la tabla para que la columna `estado de ganancia` soporte la funcionalidad de *drill down*.
  - Hacer que la data de esta columna sea clickeable/interactiva según el estándar de componentes del proyecto.

- [ ] **4. Eliminar inyección incorrecta (Kaypacha Service)**
  - El componente está cargando e inyectando un servicio relacionado a `kaypacha`, lo cual no tiene sentido en este contexto de rentabilidad.
  - Eliminar esa importación/inyección y asegurarse de utilizar los servicios de datos correspondientes a su propio módulo (por ejemplo, `actividad-mensual-repo.service.ts`).

## 📂 Posibles archivos a modificar

* **Componente (Lógica e Inyecciones):** 
  `.../cuenta-resultados/cuenta-resultados.component.ts`
* **Vista (Skeleton y Spinner):** 
  `.../cuenta-resultados/cuenta-resultados.component.html`
* **Configuración de Tabla (Columnas y Drill-down):**
  `src/app/pages/modules/reportes/components/actividad-mensual/utils/cuenta-resultados.util.ts`