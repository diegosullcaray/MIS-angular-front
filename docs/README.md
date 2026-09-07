# Documentación — MIS Host

Portal administrador de Financiera Confianza: Angular 22 zoneless, PrimeNG y
Tailwind v4.

## Estructura canónica

La documentación se organiza por responsabilidad. Las carpetas numeradas
anteriores fueron retiradas; la información vigente vive en las áreas
canónicas siguientes.

| Área | Entrada | Responsabilidad |
|---|---|---|
| Inicio | [`onboarding.md`](./onboarding.md) | Primer día y rutas de lectura |
| Negocio | [`business/`](./business/) | Glosario, dominio y roadmap |
| Features | [`features/`](./features/) | Flujos y especificaciones de pantalla |
| Componentes | [`components/`](./components/) | Design system, catálogo y estados de UI |
| Plantillas | [`templates/`](./templates/) | PR, bug report y ADR |
| Desarrollo | [`development/`](./development/) | Setup, estilo y pruebas |
| Arquitectura | [`architecture/`](./architecture/) | Decisiones, diagramas y contratos |
| Seguridad | [`security/`](./security/) | Autorización, secretos y datos sensibles |
| Reportes | [`reports/`](./reports/) | Coverage, rendimiento y evidencia generada |

### Gobierno de datos

- [Glosario de negocio y datos](./business/glossary.md)
- [Contratos API](./architecture/api-contracts/README.md)
- [Modelo de acceso y navegación](./architecture/api-contracts/access-model.md)
- [Flujo de datos](./architecture/data-flow.md)
- [Inventario de modulos y rutas](./architecture/module-inventory.md)
- [Decisiones arquitectónicas](./architecture/decision-records.md)
- [Seguridad](./security/README.md)
- [Modelo de amenazas](./security/threat-model.md)

## Por dónde empezar

| Si querés… | Leé |
|---|---|
| Entender qué es el producto | [`business/product-vision.md`](./business/product-vision.md) |
| Conocer los dominios de negocio | [`business/domain-catalog.md`](./business/domain-catalog.md) |
| Entender cómo está construido | [`architecture/system-overview.md`](./architecture/system-overview.md) |
| Consultar las rutas vigentes | [`architecture/module-inventory.md`](./architecture/module-inventory.md) |
| Agregar o tocar un módulo | [`development/module-guide.md`](./development/module-guide.md) |
| Crear la tabla de un reporte | [`architecture/reporting-contracts.md`](./architecture/reporting-contracts.md) |
| Crear un reporte paso a paso | [`architecture/report-creation-guide.md`](./architecture/report-creation-guide.md) |
| Entender un término del payload o del negocio | [`business/glossary.md`](./business/glossary.md) |
| Saber por qué algo carga lento o no carga | [`reports/performance/legacy-comparison.md`](./reports/performance/legacy-comparison.md) |
| Saber qué pruebas existen | [`development/test-inventory.md`](./development/test-inventory.md) |

## Cómo se mantiene esta documentación

- **Un documento que ya no describe el código se borra**, no se deja "por si
  acaso". Un mapa desactualizado hace más daño que no tener mapa.
- Lo que cambia con cada commit —inventario de pantallas, número de tests,
  métricas— no va en un `.md`: se lee del código.
- Lo que sí va: el **porqué** de una decisión, los contratos con el backend que
  no se deducen del código, y las trampas que ya nos costaron un bug.
- Cada carpeta canónica debe tener un `README.md` cuando necesite navegación
  propia. No crear índices vacíos ni duplicar el estado global en otra carpeta.
