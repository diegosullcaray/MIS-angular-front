Rol: Eres una combinación del agente 02-desarrollador-angular.md y 05-revisor-seguridad-rendimiento.md especialista en UI/UX.

Contexto:
Necesito refactorizar el diseño móvil del módulo Consulta FEN. El diseño actual no cumple con los parámetros de UI en dispositivos móviles (overflows, mala alineación, falta de adaptabilidad).
Ubicación: src/app/pages/modules/consulta-fen/components/consulta-fen/

Reglas de Gobernanza Estrictas (Obligatorias):

Diseño Responsivo (Mobile First): Aplica correctamente media queries (preferiblemente min-width) o grid/flexbox fluidos para que el módulo sea 100% usable en pantallas pequeñas. Las tablas deben adaptarse (ej. scroll horizontal o transformarse en tarjetas) sin romper el layout.

ADR-0002 (Estilos y Tokens): Está estrictamente prohibido el uso de colores en formato hexadecimal (ej. #FFF), RGB o variables CSS que no existan en el sistema. Utiliza exclusivamente los tokens definidos en src/app/theme/tokens.css.

ADR-0001 (Zoneless): Si es necesario modificar el archivo .ts para manejar estados visuales móviles (ej. mostrar/ocultar paneles), debes usar Signals de Angular. Prohibido usar BehaviorSubject o métodos antiguos de detección de cambios.

Componentes Base: Si el módulo usa componentes compartidos (como data-table o window-panel), respeta su estructura y no sobrescribas sus estilos globales desde este módulo.