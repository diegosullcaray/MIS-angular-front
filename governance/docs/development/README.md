# Desarrollo

Cómo se trabaja en este repositorio.

- [Setup local](./setup-guide.md) — requisitos, comandos y entornos
- [Convenciones de desarrollo](./conventions.md) — qué hacer antes, durante y después de un cambio
- [Convenciones de nombres](./naming-conventions.md) — sufijos, rutas e identificadores
- [Guía de módulos](./module-guide.md) — estructura y responsabilidad por capa
- [Guía de creación de reportes](./report-creation-guide.md) — el flujo más frecuente del proyecto
- [Modelo de estados](./state-model.md) — ownership del estado y ciclo carga/vacío/error
- [Testing](./testing.md) — estrategia · [Inventario de pruebas](./test-inventory.md) — cifras derivadas
- [Compuertas de calidad](./quality-gates.md) — qué se verifica, con qué comando y qué bloquea

## Guías operativas

Las skills de `governance/skills/` son la versión aplicada de estos documentos, para tener abierta mientras se programa:

- [`angular-mis-zoneless`](../../skills/angular-mis-zoneless/SKILL.md) — señales, zoneless, antipatrones
- [`mis-module-architecture`](../../skills/mis-module-architecture/SKILL.md) — dónde va cada archivo
- [`mis-component-styling`](../../skills/mis-component-styling/SKILL.md) — tokens, PrimeNG y los cuatro estados
- [`mis-winder-ant`](../../skills/mis-winder-ant/SKILL.md) — el transporte por donde entran los datos
- [`mis-reportes-bloques`](../../skills/mis-reportes-bloques/SKILL.md) — motores de reporte y jerarquía
- [`mis-testing-guide`](../../skills/mis-testing-guide/SKILL.md) — Vitest y Playwright

## Antes de tocar un dato

Un cambio que toca cifras necesita además el [gobierno del dato](../data/README.md): contrato, jerarquía, fecha de corte y clasificación. La [ficha de reporte](../templates/report-spec-template.md) obliga a resolverlos antes de escribir código.

## Sobre las cifras

Rutas, cantidad de pruebas, catálogo de `cod_rep` y peso del bundle son evidencia puntual, no KPI histórico: se regeneran con `npm run inventario` antes de citarlas.
