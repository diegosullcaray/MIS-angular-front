Actúa como un desarrollador Frontend Senior experto en Angular, PrimeNG y Tailwind CSS. Debes resolver la siguiente lista de incidencias en un proceso de migración de un sistema legacy a la nueva arquitectura. Revisa cada ruta, compara con el comportamiento esperado y aplica las correcciones exactas.

Tarea 1: Corrección de Comportamiento en Monitor IMR

Módulo: actividad-diaria/cartera/mon-imr

Problema: Al hacer clic en las tarjetas de KPI, se están abriendo cuadros de diálogo (modales) de forma incorrecta.

Acción requerida: Revisa la ruta legacy (http://localhost:4200/app/reportes/repositorio/actividad-diaria/cartera/mon-imr). Elimina los eventos de clic ((click)) vinculados a la apertura de modales en los KPIs de la vista actual o corrige la condición de renderizado para que coincida exactamente con el legacy.

Tarea 2: Corrección Estructural y Error 500 en Monitor de Efectividades

Módulo: leg/com/rda/adm/mon-efec

Problemas: El reporte no carga debido a un Error 500 (reporte-bloques.base.ts:56). Faltan pestañas de navegación y un panel complejo de filtros.

Acciones requeridas:

Revisa el archivo de respaldo data-extraida.md para entender el payload esperado. Maneja el error 500 temporalmente y verifica la estructura de la petición.

Implementa un componente de pestañas (p-tabView) con dos secciones: "Monitor de Efectividades" y "Detalle de Efectividades".

En la pestaña "Detalle de Efectividades", implementa la siguiente lista de filtros usando componentes PrimeNG (p-dropdown, p-calendar, etc.): Tramo, Producto, Compromiso Roto, 0 Cuota, 1 Cuota, Tramo Días Gestión, Precosecha, Última Gestión, Fecha Compromiso, Asesor. Todos deben incluir la opción "TODO" por defecto.

Tarea 3: Optimización de Carga en Seguimiento Reprogramados

Módulo: leg/com/rda/adm/mon-efecrepro

Problema: La tabla no termina de renderizar o falla por tiempo de espera.

Acción requerida: Incrementa el tiempo de espera (timeout) en la petición HTTP del servicio asociado para permitir que la data masiva cargue correctamente antes de abortar la solicitud.

Tarea 4: Optimización de Carga en Seguimiento de Portafolio

Módulo: leg/com/rda/adm/ava-port

Problema: La petición a cores2/ant/v1/g... lanza un Error 500, posiblemente por un timeout en el servidor o cliente.

Acción requerida: Al igual que en la Tarea 3, aumenta el tiempo límite de espera para la respuesta del servidor en el interceptor o servicio HTTP específico de esta vista.

Tarea 5: Implementación de Filtros y KPIs en Colocación de Seguro Optativo

Módulo: actividad-diaria/seguro/seguro-com

Problemas: Faltan los filtros de fecha, faltan KPIs dinámicos y el diseño actual es deficiente.

Acciones requeridas:

Implementa los filtros de fecha (ej. p-calendar con rango) idénticos al legacy.

Extrae y mapea dinámicamente del backend los siguientes KPIs (no usar datos en duro/hardcoded): Total Operaciones, Total Seguros (Colocados), y Penetración Global (%).

Mejora drásticamente el diseño UI de las tarjetas de KPI utilizando Tailwind CSS (añade sombras sutiles, bordes redondeados y una mejor tipografía) para darles un aspecto moderno y profesional.