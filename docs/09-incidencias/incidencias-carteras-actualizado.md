Contexto para el Agente:
Actúa como un desarrollador Frontend Senior experto en Angular, PrimeNG, TailwindCSS y Highcharts. Necesito que resuelvas la siguiente lista de pendientes (bugs y faltantes de migración) comparando el código actual con el comportamiento del sistema legacy.

Por favor, aborda las siguientes tareas organizadas por componente:

Tarea 1: Componente "Monitor Salidas y Retenciones"
Ruta del archivo: D:\FINANCIERA CONFIANZA\04 SISTEMAS\05 MIGRACIONES\MIS-angular-front\src\app\pages\modules\reportes\components\actividad-diaria\components\Cartera\items\monitor-salidas-retenciones

Problema: Falta renderizar el indicador visual de estado (el punto de colores / colored dot) dentro de las filas de la tabla.

Acción requerida:

Revisar el código del sistema legacy para extraer la lógica condicional que define los colores de los indicadores.

Implementar este indicador en la tabla actual de PrimeNG utilizando clases de Tailwind CSS (ej. w-3 h-3 rounded-full bg-red-500, etc.) para dibujar el punto de color según corresponda.

Tarea 2: Componente "Gestión Comercial"
Ruta del archivo: D:\FINANCIERA CONFIANZA\04 SISTEMAS\05 MIGRACIONES\MIS-angular-front\src\app\pages\modules\reportes\components\actividad-diaria\components\Cartera\items\gestion-comercial

Ruta de referencia Legacy: http://localhost:4200/app/reportes/repositorio/actividad-diaria/cartera/gest-comercial

Problemas y Acciones requeridas:

Filtro de Fecha: El componente actual carece del filtro de fecha nativo que sí existe en el legacy. Implementar este filtro usando componentes de PrimeNG (ej. p-calendar) maquetado con Tailwind CSS.

Mapeo de KPIs (Tarjetas de métricas): Actualmente no se están mapeando los KPIs en la vista. Debes renderizar los siguientes bloques de datos replicando la estructura del legacy, incluyendo sus métricas secundarias (TMM, %, VAR, etc.):

PRODUCTIVIDAD: 13.88 | TMM 0.76 | %Cumpl. 96% | 80.9% | 17.2

TICKET PROM.: 12.11 mil | TMM -247.91 | 96.57% | 12.54

DESEMBOLSOS: 244.05M | TMM 5.79 M | %Cumpl. 95.38% | 78.24% | 311.93

CANCELACIÓN VIG.: 244,600.8 | 93.9% | 260.50

CARTERA VIGENTE: 2,432.304 | META -2.76 | VAR. -17.89 | DIST. -15.12

RODAMIENTO: 17,339 | TMM -615.5

NO VIGENTE: 17,583.1 | TMM -635.6

VIGENTE: 244 | TMM -20

STOCK CLIENTES: 210.712 | VAR. 861.0 | 20.08 | 4.29

CLIENTES NUEVOS: 5,820 | TMM 358 | %Cumpl. 89% | 75.23%

Gráficos (Highcharts): Corregir y renderizar las gráficas del legacy utilizando la librería Highcharts. Si es necesario un tipo de gráfico específico, reutilizar o adaptar los componentes existentes en el módulo shared respetando su documentación interna.

Tarea 3: Componente "Rank Comercial"
Ruta de referencia Legacy: http://localhost:4200/app/reportes/repositorio/actividad-diaria/cartera/rank-comercial

Problemas y Acciones requeridas:

Independencia de Filtros: Desvincular este componente del filtro principal/global de la aplicación. Este componente solo debe utilizar sus filtros internos propios.

Indicador Faltante: Falta implementar el indicador visual de "Avance Esperado (Timing)". Revisa el legacy para copiar su diseño, lógica de cálculo e impleméntalo usando Tailwind CSS y la estructura del nuevo proyecto.