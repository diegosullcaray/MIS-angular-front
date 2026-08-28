Contexto para el Agente:
Actúa como un desarrollador Frontend Senior experto en Angular, PrimeNG, TailwindCSS y Highcharts. Necesito que resuelvas la siguiente lista de pendientes (bugs y faltantes de migración) comparando el código actual con el comportamiento del sistema legacy.

Por favor, aborda las siguientes tareas organizadas por componente:

Tarea 1: Componente "Monitor Salidas y Retenciones"
Ruta del archivo: D:\FINANCIERA CONFIANZA\04 SISTEMAS\05 MIGRACIONES\MIS-angular-front\src\app\pages\modules\reportes\components\actividad-diaria\components\Cartera\items\monitor-salidas-retenciones

Problema: Falta renderizar el indicador visual de estado (el punto de colores / colored dot) ahora falta en el kpi Churn rate

Acción requerida:

Revisar el código del sistema legacy para extraer la lógica condicional que define los colores de los indicadores.

Implementar este indicador en la tabla actual de PrimeNG utilizando clases de Tailwind CSS (ej. w-3 h-3 rounded-full bg-red-500, etc.) para dibujar el punto de color según corresponda.

Tarea 2: Componente "Gestión Comercial"
Ruta del archivo: D:\FINANCIERA CONFIANZA\04 SISTEMAS\05 MIGRACIONES\MIS-angular-front\src\app\pages\modules\reportes\components\actividad-diaria\components\Cartera\items\gestion-comercial

Ruta de referencia Legacy: http://localhost:4200/app/reportes/repositorio/actividad-diaria/cartera/gest-comercial

Problemas y Acciones requeridas:

Filtro de Fecha: El componente actual carece del filtro de fecha nativo que sí existe en el legacy. Implementar este filtro usando componentes de PrimeNG (ej. p-calendar) maquetado con Tailwind CSS.


Gráficos usando la libreria  (Highcharts) importante : Corregir y renderizar las gráficas del legacy utilizando la librería Highcharts. Si es necesario un tipo de gráfico específico, reutilizar o adaptar los componentes existentes en el módulo shared respetando su documentación interna. andemas en los graficos segementar por colores como etsa en el legacy ademas usa los tokens de coloes que tiene el sistema 
en caso que no haya integra de acuerdo al mcp de Highcharts los graficos faltantes en el shared par ausarlos 

al igual de las tablas , saca del tab de clientes Var. Clientes Stock que eso va en el tab de saldo cartera , admeas en el legacy las celdas de la tabal estaban coloreadas el bakround , en cambio en el que migraste no se encuentra de esa manera 






Tarea 3: Componente "Rank Comercial"
Ruta de referencia Legacy: http://localhost:4200/app/reportes/repositorio/actividad-diaria/cartera/rank-comercial

Problemas y Acciones requeridas:



Indicador Faltante: Falta implementar el indicador visual de "Avance Esperado (Timing)". Revisa el legacy para copiar su diseño, lógica de cálculo e impleméntalo usando Tailwind CSS y la estructura del nuevo proyecto.

Avance ≥ esperado
Entre el 80 % y el 100 % del esperado
Por debajo del 80 %  , esos en el legacy no esta quita y corrije  no me incluyas cosas que no estan en el legacy 