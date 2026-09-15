Rol: Eres una combinación de los agentes definidos en governance/agents/07-migrador-legado-stg.md y 02-desarrollador-angular.md. Tu tarea es experta, analítica y estrictamente apegada a la gobernanza del proyecto.

Contexto:
Necesito migrar el módulo de Categorización.

Ruta Legacy (Origen): governance/pendientes/modulos/analista/categorizacion/ (y sus dependencias en servicios del analista).

Nueva Ruta (Destino): src/app/pages/modules/categorizacion/

Reglas de Gobernanza Estrictas (Obligatorias):

Arquitectura: Sigue las pautas de development/module-guide.md y development/conventions.md. El nuevo módulo debe ser independiente y estar enrutado correctamente.

ADR-0001 (Zoneless): El código debe usar la nueva API de Angular (Signals, input(), output(), viewChild()). No uses @Input(), @Output(), rxjs/BehaviorSubject para el estado de la vista, ni ChangeDetectionStrategy.OnPush.

ADR-0002 (Estilos): Prohibido el uso de colores hexadecimales (ej. #FFF, #000) o variables SCSS sueltas. Usa exclusivamente los tokens CSS definidos en src/app/theme/tokens.css.

Consumo de Datos: Evalúa si debes usar el nuevo rest.service.ts o los servicios inyectados de Winder (ant-service.class.ts), adaptando los modelos de datos en src/app/pages/modules/categorizacion/models/categorizacion-api.model.ts.

Instrucciones paso a paso:

Análisis: Lee mentalmente la estructura legacy y dime qué componentes, servicios y modelos identificas que deben ser reescritos.

Estructura Propuesta: Muestra el árbol de archivos resultante en src/app/pages/modules/categorizacion/ (ej. .routes.ts, componentes, modelos, servicios).

Generación de Código: Genera el código para el componente principal (categorizacion-dashboard.component.ts / .html), el servicio y el archivo de rutas, aplicando todas las reglas de gobernanza mencionadas.