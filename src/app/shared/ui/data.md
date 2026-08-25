Revisando el árbol de tu proyecto, he identificado varias carpetas y componentes que actualmente están "escondidos" dentro de módulos específicos (principalmente en reportes y presupuesto), pero que por su naturaleza genérica deberían ser promovidos a src/app/shared/ui/.

Tienes incluso componentes duplicados en distintos módulos que hacen exactamente lo mismo. Centralizar esto te ahorrará miles de líneas de código y dolores de cabeza en el futuro.

Aquí están los candidatos ideales para migrar a shared/ui:

1. Selectores de Jerarquía (Duplicados evidentes)
He notado que tienes un componente llamado hier-selector repetido en al menos dos lugares:

src/app/pages/modules/reportes/components/ui/hier-selector/

src/app/pages/modules/presupuesto/components/ui/hier-selector/
Acción: Deberías fusionarlos y crear un único src/app/shared/ui/hier-selector/. La selección de jerarquías organizativas es un requerimiento transversal en todo el sistema.

2. Tablas Avanzadas (Actualmente dispersas)
Tienes muchísimos tipos de tablas distribuidos por todo el proyecto. Deberías centralizarlos en shared/ui/tablas/ o integrarlos a tu shared/ui/data-table/:

reportes/.../support/components/table/ (table-ajax, table-basic, table-multiheader)

reportes/components/ui/tabla-dinamica/

reportes/components/ui/tabla-reporte/

presupuesto/components/ui/editable-table/
Acción: Mueve esto a shared/ui/. Si un día decides cambiar de Angular Material a PrimeNG (o viceversa) para tus tablas, solo tendrás que modificar los componentes compartidos, no buscar en 20 carpetas distintas.

3. Controles de Formulario Genéricos (Filtros y Autocompletados)
Dentro del módulo de reportes tienes una subcarpeta support/components/ que actúa como un "falso shared". Todo lo que está ahí es UI pura y genérica:

reportes/.../support/components/select/ (select-basic, select-group, select-multiple, select-single)

reportes/.../support/components/auto-complete/

reportes/components/ui/select-filtro/
Acción: Mueve estas carpetas directamente a src/app/shared/ui/selects/ y src/app/shared/ui/auto-complete/. No tienen por qué vivir dentro de reportes si mañana dashboard o analista los necesitan.

4. Gráficos (El problema que originó esta charla)
Como discutimos, todo lo relacionado a pintar Highcharts, ApexCharts o Chart.js:

reportes/components/ui/grafico-highcharts/

reportes/components/ui/grafico-reporte/

reportes/.../support/components/graphic/
Acción: Todo esto se fusiona en el patrón Wrapper dentro de src/app/shared/ui/graficos/.

5. Mapas de Ubicación
reportes/components/ui/mapa-ubicacion/
Acción: Pintar un mapa en pantalla es una tarea visual pura. Debería vivir en src/app/shared/ui/mapas/ para que cualquier módulo que necesite mostrar una agencia, corresponsal o cliente pueda usarlo enviándole simplemente unas coordenadas [lat] y [lng].

Resumen de tu futura arquitectura en Shared
Si haces esta limpieza, tu carpeta shared/ui pasará de tener solo cosas básicas (como loaders y empty-states) a ser una verdadera librería de componentes UI de Financiera Confianza, quedando estructurada más o menos así:

Plaintext
src/app/shared/ui/
 ├── auto-complete/    (Movido de reportes/support)
 ├── buscador/         
 ├── data-table/       (Consolidado con tablas dinámicas, editables, etc)
 ├── empty-state/
 ├── formularios/      (Inputs, selects básicos, select-multiple)
 ├── graficos/         (Highcharts wrappers)
 ├── hier-selector/    (El selector de jerarquías unificado)
 ├── mapas/            (mapa-ubicacion)
 └── overlays/         (loading, redirect, toasts)