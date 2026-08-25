src/app/shared/ui/graficos/
├── grafico-base/
│   ├── grafico-base.component.html
│   ├── grafico-base.component.scss
│   └── grafico-base.component.ts    <-- Renderizador puro (Agnóstico)
├── grafico-pie/
│   └── grafico-pie.component.ts     <-- Pre-configurado para Donas/Pie
├── grafico-mixto/
│   └── grafico-mixto.component.ts   <-- Pre-configurado para Barras + Líneas
├── models/
│   └── grafico-comun.model.ts       <-- Interfaces (Series, Categorías)
└── utils/
    ├── highcharts-factory.util.ts   <-- Funciones que arman el objeto Highcharts
    └── paleta-colores.util.ts       <-- Colores corporativos de Financiera Confianza


    2. ¿Cómo funciona esta arquitectura?
Para evitar el "reciclado" sucio, cada capa tiene una única responsabilidad:

El grafico-base (El lienzo tonto): Este componente no sabe nada de reportes, ni de créditos, ni de captaciones. Su único trabajo es recibir un objeto genérico de tipo Highcharts.Options mediante un @Input() y dibujarlo. Si la ventana cambia de tamaño, él se redimensiona. Si el tema cambia a oscuro, él se actualiza.

Los componentes específicos (Pie, Mixto, Barras): Son componentes que envuelven al grafico-base. En lugar de pedirle a la vista del reporte que sepa armar configuraciones complejas de Highcharts, estos componentes reciben data simple (ej. [nombres]="..." [valores]="...") y usan las utilidades para traducirlo a Highcharts.

Las Utilidades (highcharts-factory): Aquí centralizas configuraciones repetitivas. Por ejemplo, una función crearOpcionesBarraHorizontal(data, oscuro) que te devuelve la estructura de Highcharts ya con los márgenes, tooltips corporativos y la paleta de colores correcta.

3. El Flujo de Datos
Cuando crees un nuevo reporte en tu módulo (por ejemplo en cmg-clientes-flujo), el flujo será así:

El componente del reporte hace la petición HTTP y obtiene la data pura (JSON).

El reporte mapea esa data a un formato simple (arreglo de números y categorías).

En el HTML del reporte llamas a <app-grafico-mixto [categorias]="meses" [series]="data">.

app-grafico-mixto usa la fábrica para crear las Highcharts.Options y se las pasa internamente a <app-grafico-base [opciones]="opts">.

Al hacerlo así, si mañana Financiera Confianza te pide que todas las gráficas de barras ahora tengan bordes redondeados, solo modificas la función en highcharts-factory.util.ts, y todos los reportes del sistema se actualizarán automáticamente sin tocar la lógica de ningún módulo.

Para ayudarte a afinar la implementación técnica: ¿Estás utilizando el paquete oficial highcharts-angular o estás instanciando los gráficos manualmente usando Highcharts.chart('contenedor', opciones) en tu componente actual?