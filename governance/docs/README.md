# Documentación — MIS Host

Portal administrador de Financiera Confianza: Angular 22 zoneless, PrimeNG 21 y Tailwind v4, sobre el backend Ant mediante el transporte Winder.

## Estructura

La documentación se organiza por responsabilidad. **[`data/`](./data/) es el eje**: el resto de las áreas existen para que el dato llegue correcto a la pantalla.

| Área | Responsabilidad |
|---|---|
| [`data/`](./data/README.md) | **Gobierno del dato**: glosario, catálogo, contratos, linaje, calidad, clasificación y responsabilidades |
| [`architecture/`](./architecture/README.md) | Cómo está construido el frontend: capas, arranque, decisiones |
| [`business/`](./business/README.md) | Producto, dominios, flujos de usuario y roadmap |
| [`development/`](./development/README.md) | Setup, convenciones, guías de trabajo, pruebas y compuertas |
| [`components/`](./components/README.md) | Design system, catálogo de componentes y estados de UI |
| [`security/`](./security/README.md) | Autorización, secretos, amenazas y remediación |
| [`templates/`](./templates/README.md) | Plantillas: ficha de reporte, feature, PR, bug, ADR, evidencia |
| [`evidence/`](./evidence/README.md) | Evidencia generada: cobertura, rendimiento, auditorías, incidentes |
| [`onboarding.md`](./onboarding.md) | Primer día y ruta de lectura |

> `evidence/` se llamaba `reports/`. Se renombró porque en un sistema cuyo dominio central es literalmente "reportes", una carpeta de gobernanza llamada igual pero con otro significado confundía a todo el mundo.

## Gobierno del dato

El [marco completo](./data/README.md) y sus siete documentos:

| Pregunta | Documento |
|---|---|
| ¿Qué significa este término? | [Glosario](./data/glossary.md) |
| ¿Qué datos consume el sistema y de dónde salen? | [Catálogo](./data/catalog.md) |
| ¿Cuál es la forma exacta del dato en el borde? | [Contratos](./data/contracts/README.md) |
| ¿Por dónde pasó esta cifra? | [Linaje](./data/lineage.md) |
| ¿Cómo sé que este dato es correcto? | [Calidad](./data/quality.md) |
| ¿Qué cuidado requiere este dato? | [Clasificación](./data/classification.md) |
| ¿Quién decide sobre este dato? | [Responsabilidades](./data/stewardship.md) |

Contratos vigentes: [transporte Winder/Ant](./data/contracts/winder-transport.md), [motores de reporte](./data/contracts/reporting-contracts.md), [jerarquía organizativa](./data/contracts/organizational-hierarchy.md) y [modelo de acceso](./data/contracts/access-model.md).

## Por dónde empezar

| Si querés… | Leé |
|---|---|
| Entender qué es el producto | [Visión del producto](./business/product-vision.md) |
| Conocer los dominios de negocio | [Catálogo de dominios](./business/domain-catalog.md) |
| Entender cómo está construido | [System overview](./architecture/system-overview.md) |
| Saber cómo llegan los datos | [Transporte Winder / Ant](./data/contracts/winder-transport.md) |
| Rastrear de dónde salió una cifra | [Linaje del dato](./data/lineage.md) |
| Consultar las rutas vigentes | [Inventario de módulos](./architecture/module-inventory.md) |
| Ver qué `cod_rep` consume el sistema | [Catálogo de datos](./data/catalog.md) |
| Agregar o tocar un módulo | [Guía de módulos](./development/module-guide.md) |
| Crear un reporte paso a paso | [Guía de creación de reportes](./development/report-creation-guide.md) |
| Saber cómo se nombra un archivo | [Convenciones de nombres](./development/naming-conventions.md) |
| Saber qué verifica el pipeline | [Compuertas de calidad](./development/quality-gates.md) |
| Entender un término del payload | [Glosario](./data/glossary.md) |
| Saber por qué algo carga lento | [Comparación con el legado](./evidence/performance/legacy-comparison.md) |
| Saber qué pruebas existen | [Inventario de pruebas](./development/test-inventory.md) |
| Ver el estado real de la gobernanza | [Auditoría 2026-09](./evidence/quality/auditoria-gobernanza-2026-09.md) |

## Cómo se mantiene esta documentación

- **Cuando el documento y el código discrepan, gana el código.** El documento se corrige o se borra; no se deja "por si acaso". Un mapa desactualizado hace más daño que no tener mapa.
- **Lo que cambia con cada commit se deriva, no se escribe.** Inventario de módulos, catálogo de `cod_rep` y cifras de pruebas se generan con `npm run inventario` y se inyectan entre marcadores `<!-- generado:inicio … -->`. Editar a mano el contenido entre esos marcadores no sirve: la próxima regeneración lo pisa.
- **Lo que sí se escribe a mano**: el porqué de una decisión, los contratos con el backend que no se deducen del código, y las trampas que ya costaron un bug.
- **Se verifica automáticamente.** `npm run audit:docs` detecta enlaces rotos, rutas de código citadas que ya no existen, símbolos y tokens nombrados en las guías que no aparecen en `src/`, y documentos que nadie enlaza.
- Cada área tiene `README.md` cuando necesita navegación propia. No crear índices vacíos ni duplicar el estado global.
