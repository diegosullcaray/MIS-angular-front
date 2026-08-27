Actúa como un desarrollador Frontend Senior experto en Angular, PrimeNG y Tailwind CSS. Implementa las siguientes correcciones de diseño, estructura y manejo de datos en el proceso de migración de reportes.

Tarea 1: Estructuración y Manejo de Errores en Proyección Colocación

Ruta: leg/com/rda/adm/proy_M1

Problemas: La vista no maneja correctamente la excepción del backend (Error 500 / NullPointerException por "Resultado vacio para: regularData"). Falta estructura de pestañas.

Acciones requeridas:

Timeout y Errores: Incrementa el tiempo de espera (timeout) en la petición HTTP de este servicio. Adicionalmente, implementa un manejo de errores en el .catch() o interceptor para que, si el backend devuelve el error NullPointerException, la UI no se rompa y muestre un mensaje amigable (ej. "No hay datos para mostrar" o "Error de conexión").

Estructura de Pestañas: Envuelve el contenido principal en un componente p-tabView de PrimeNG con dos paneles (p-tabPanel): "Resumen" y "Detalle".

Tarea 2: Optimización de Tablas en Proyección Diaria Colocación

Ruta: leg/com/rda/adm/proy_M2

Problemas: Las dos tablas generan scroll horizontal innecesario y están apiladas en lugar de usar pestañas.

Acciones requeridas:

Tabs: Separa ambas tablas colocando cada una dentro de su propio p-tabPanel usando un p-tabView.

Ajuste de Columnas: Reduce el ancho estricto de las columnas. Utiliza clases de Tailwind (como whitespace-normal text-center break-words) en los encabezados (th) y celdas (td) de la tabla de PrimeNG para permitir el salto de línea del texto. El objetivo es que las tablas se adapten al 100% del ancho de la pantalla sin generar overflow-x.

Tarea 3: Implementación de KPIs y Gráficos en Banca Solidaria

Ruta: actividad-diaria/cartera/banca-solidaria

Problemas: Faltan las tarjetas de indicadores (KPIs) y las gráficas del dashboard legacy.

Acciones requeridas:

KPIs Dinámicos: Mapea y renderiza usando Tailwind CSS un bloque de tarjetas en la parte superior con los siguientes indicadores (conectar con la data del servicio): Saldo Vigente (ej. S/ 4,021,011), Mto. Desembolsado (ej. S/ 1,884,900), Ticket Promedio (ej. S/ 1,312.60), N° Clientes (ej. 5,380), Tasa Mes (ej. 100%).

Gráficos Highcharts: Integra la librería Highcharts (reutilizando los wrappers del módulo shared si existen) para renderizar dos gráficas idénticas al legacy: "Estado de Renovación (Base Inicial)" y "Antigüedad de Cliente".