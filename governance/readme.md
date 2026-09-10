# Marco de Gobernanza — MIS Host

Centro de gobernanza, automatización y estándares técnicos de **Financiera Confianza (MIS Host)**: portal administrador en **Angular 22 zoneless**, **PrimeNG 21** y **Tailwind CSS v4**, sobre el backend **Ant** mediante el transporte **Winder**.

```text
governance/
  ├── scripts/                      automatización: scaffolding, verificación, inventarios
  ├── skills/                       guías operativas para desarrolladores y agentes
  ├── agents/                       pipeline de 5 agentes especializados
  ├── docs/                         documentación canónica
  ├── gobernanza.linea-base.json    deuda congelada (ver ADR-0003)
  └── readme.md
```

**Regla que gobierna todo lo demás: cuando la documentación y el código discrepan, gana el código.** El documento se corrige. La [auditoría de septiembre 2026](./docs/evidence/quality/auditoria-gobernanza-2026-09.md) encontró cinco reglas que estas guías exigían y el repositorio nunca cumplió; corregirlas fue el punto de partida de la versión actual.

---

## 1. Verificación

Un solo comando antes de cada commit:

```bash
npm run verify        # gobernanza + documentación + tokens + inventarios (segundos, sin compilar)
npm run verify:ci     # además unitarias, build y control de bundle
```

Qué verifica cada compuerta, qué bloquea y cómo se maneja la deuda heredada: [compuertas de calidad](./docs/development/quality-gates.md).

## 2. Scripts (`governance/scripts/`)

| Script | Para qué |
|---|---|
| [`crear-modulo.mjs`](./scripts/crear-modulo.mjs) | genera un módulo completo: estructura canónica, servicio contra Winder/Ant, los cuatro estados y specs que ya pasan |
| [`ejecutar-pruebas.mjs`](./scripts/ejecutar-pruebas.mjs) | lanzador único de pruebas, auditorías y cadenas de verificación |
| [`validar-gobernanza.mjs`](./scripts/validar-gobernanza.mjs) | motor de 14 reglas de arquitectura y seguridad, con niveles y línea base |
| [`validar-documentacion.mjs`](./scripts/validar-documentacion.mjs) | enlaces, rutas y símbolos citados en `governance/` que ya no existen |
| [`generar-inventario.mjs`](./scripts/generar-inventario.mjs) | deriva del código el inventario de módulos y de pruebas |
| [`verificar-bundle.mjs`](./scripts/verificar-bundle.mjs) | controla el artefacto de producción: identidades, source maps, tokens, peso |
| [`generar-tokens-paleta.mjs`](./scripts/generar-tokens-paleta.mjs) | sincroniza `tokens.paleta.ts` con `tokens.css` |
| [`verificar-anclas-tour.mjs`](./scripts/verificar-anclas-tour.mjs) | los pasos de los recorridos guiados apuntan a algo que existe |
| [`verificar-activos.mjs`](./scripts/verificar-activos.mjs) | `src/assets`: referenciados que faltan, huérfanos y peso |

Manual completo: [`scripts/README.md`](./scripts/README.md).

## 3. Skills (`governance/skills/`)

Guías aplicadas, para usar mientras se escribe código. Registradas en `.agents/skills.json`.

| Skill | Qué resuelve |
|---|---|
| [`angular-mis-zoneless`](./skills/angular-mis-zoneless/SKILL.md) | señales, zoneless y por qué acá **no** se usa `OnPush` |
| [`mis-module-architecture`](./skills/mis-module-architecture/SKILL.md) | dónde va cada archivo y qué sufijo lleva |
| [`mis-component-styling`](./skills/mis-component-styling/SKILL.md) | tokens `--mis-*`, PrimeNG y los cuatro estados |
| [`mis-winder-ant`](./skills/mis-winder-ant/SKILL.md) | el transporte real por donde entran los datos — **no hay REST** |
| [`mis-reportes-bloques`](./skills/mis-reportes-bloques/SKILL.md) | motores de reporte, jerarquía y fecha de corte |
| [`mis-testing-guide`](./skills/mis-testing-guide/SKILL.md) | Vitest y Playwright con las convenciones del repo |
| [`mis-ventanas-dialogos`](./skills/mis-ventanas-dialogos/SKILL.md) | el cromo compartido, el semáforo y las trampas de `p-dialog` |
| [`mis-tours-guiados`](./skills/mis-tours-guiados/SKILL.md) | recorridos sobre la interfaz real, anclas y personaje |

## 4. Agentes (`governance/agents/`)

Pipeline de cinco fases, cada una con criterio de rechazo explícito:

1. [Investigador de requerimientos](./agents/01-investigador-requerimientos.md) — emite la especificación técnica
2. [Desarrollador Angular](./agents/02-desarrollador-angular.md) — implementa
3. [QA y pruebas](./agents/03-tester-qa.md) — dictamina con evidencia
4. [Auditor de contratos y datos](./agents/04-auditor-contratos-datos.md) — verifica que el dato signifique lo documentado
5. [Seguridad y rendimiento](./agents/05-revisor-seguridad-rendimiento.md) — última compuerta antes del PR

Y dos agentes transversales, que no atienden un cambio sino una condición del repositorio:

- [Curador de gobernanza](./agents/06-curador-de-gobernanza.md) — persigue la deriva entre el código y lo que la gobernanza afirma
- [Migrador del legado STG](./agents/07-migrador-legado-stg.md) — usa el código del sistema viejo como especificación, en vez de la memoria

Detalle del flujo: [`agents/README.md`](./agents/README.md).

## 5. Documentación (`governance/docs/`)

Organizada por responsabilidad, con **el gobierno del dato como eje**:

| Área | Qué contiene |
|---|---|
| [`data/`](./docs/data/README.md) | glosario, catálogo, contratos, linaje, calidad, clasificación y responsabilidades |
| [`architecture/`](./docs/architecture/README.md) | capas, arranque, inventario de módulos, ADR |
| [`business/`](./docs/business/README.md) | producto, dominios, flujos y roadmap |
| [`development/`](./docs/development/README.md) | setup, convenciones, guías, pruebas y compuertas |
| [`components/`](./docs/components/README.md) | design system, catálogo de UI, cromo de ventanas y recorridos guiados |
| [`security/`](./docs/security/README.md) | amenazas, hallazgos y remediación |
| [`templates/`](./docs/templates/README.md) | ficha de reporte, feature, PR, bug, ADR, evidencia |
| [`evidence/`](./docs/evidence/README.md) | cobertura, rendimiento, auditorías e incidentes |

Entradas frecuentes: [índice general](./docs/README.md) · [onboarding](./docs/onboarding.md) · [transporte Winder](./docs/data/contracts/winder-transport.md) · [linaje del dato](./docs/data/lineage.md) · [compuertas de calidad](./docs/development/quality-gates.md)
