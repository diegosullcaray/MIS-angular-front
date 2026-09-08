# Auditoría de gobernanza — septiembre 2026

- **Estado**: Completada
- **Fecha**: 2026-09-07
- **Commit evaluado**: `bf91deb`
- **Alcance**: `governance/` completo (documentación, agentes, skills, scripts) contrastado contra `src/`, `e2e/` y la configuración del proyecto
- **Fuera de alcance**: corrección del código de `src/` — los hallazgos que lo afectan quedan registrados, no aplicados

## Resumen

La documentación de gobernanza describía un sistema parcialmente distinto al construido. Cinco reglas que agentes y skills exigían como obligatorias **nunca se cumplieron en el repositorio**, y una guía de estilos documentaba una paleta de clases inexistente. El código estaba bien; el mapa estaba mal.

Se corrigió la documentación contra el código, se agregaron las piezas que faltaban y se automatizó la detección de estos desfases para que no vuelvan a descubrirse a mano.

## Hallazgos de documentación

| # | Hallazgo | Evidencia | Severidad | Acción |
|---|---|---|---|---|
| D1 | Se exigía `ChangeDetectionStrategy.OnPush` en todo componente | **0 de 236** componentes lo declaran | Alta | Corregido: en zoneless no aporta. Documentado el porqué |
| D2 | La skill de estilos documentaba `bg-surface-card`, `text-text-primary`, `border-border`, `bg-primary-600` y otras | **0 usos** en `src/`; Tailwind v4 está sin bloque `@theme` | Alta | Corregido: el color se aplica con `text-[var(--mis-*)]` o `style` |
| D3 | Scaffold y skills enseñaban `http.get('/api/<modulo>')` | El sistema usa Winder/Ant; ese endpoint no existe | Alta | Corregido: el generador produce servicios sobre `Mod*Service` |
| D4 | Sufijos documentados `.constants.ts`, `.models.ts`, `.mappers.ts` | El repo usa `.constantes.ts` (20/20), `.model.ts` (95/98), `.util.ts` (21/21) | Media | Corregido y verificado por el auditor |
| D5 | `module-guide.md` ubicaba las pantallas en `items/` | Los módulos usan `components/`; `items/` es solo de `reportes` | Media | Corregido |
| D6 | Los specs de ejemplo importaban de `'vitest'` | **0 de 349** specs lo hacen: el proyecto usa globales | Media | Corregido |
| D7 | El transporte Winder/Ant no tenía documento propio | Solo aparecía de refilón en `data-flow.md` | Media | Nuevo: `architecture/winder-transport.md` + skill `mis-winder-ant` |
| D8 | `generar-tokens-paleta.mjs` documentaba su ruta como `scripts/` | Vive en `governance/scripts/` | Baja | Corregido, incluido el encabezado que genera |
| D9 | La documentación mencionaba "pipelines de CI/CD" | No existía ningún workflow en el repositorio | Media | Nuevo: `.github/workflows/ci.yml` |

## Hallazgos de código

Registrados, **no corregidos** en esta auditoría por estar fuera de su alcance. Congelados en `governance/gobernanza.linea-base.json`; el criterio vigente es cero hallazgos nuevos.

| # | Hallazgo | Ubicación | Severidad |
|---|---|---|---|
| C1 | `core` importa de `pages` (5 casos → **3**) | `core/interceptors/auth.interceptor.ts`, `core/interceptors/http-error.interceptor.ts`, ~~`core/recientes/recientes.service.ts`~~ | Alta |
| C2 | `shared` importa un modelo de `pages/modules/reportes` | `shared/ui/hier-selector/jerarquia-cache.service.ts:3` | Alta |
| C3 | Correo institucional real en un ejemplo de JSDoc | `core/winder/instances/mod-sys-login.service.ts:22` | Media |
| C4 | 41 servicios y utilidades sin `.spec.ts` hermano | varios, sobre todo en `reportes/**/services/` | Media |
| C5 | 62 colores hexadecimales fijos en 28 archivos de componente | plantillas y estilos fuera de `theme/` | Baja |
| C6 | 4 lecturas de `environment` fuera de `core/` | `auth`, `actividades`, `shared/services/redirect-overlay` | Baja |
| C7 | 3 contenedores modelan carga sin contemplar error ni vacío | `power-bi`, `presupuesto/gestion/responsables`, `inversion-stock-mora` | Media |
| C8 | 9 decoradores legados (`@Input`, `@ViewChild`) | diálogos de `herramientas` y `reportes/analista` | Baja |
| C9 | Directorio vacío `src/app/shared/ui/kpi-tile/` | — | Baja |

## Hallazgos de configuración

| # | Hallazgo | Severidad |
|---|---|---|
| G1 | El proyecto no tiene ESLint configurado ni como dependencia | Media |
| G2 | `tsconfig.json` no activa `strict: true` | Media |
| G3 | `tokens.paleta.ts` fallaba `--check` en cualquier checkout Windows por comparación sensible a CRLF | Media — **corregido** |

## Correcciones aplicadas

**Documentación**: reescritos los 4 skills existentes y los 3 agentes; corregidos `module-guide`, `conventions`, `design-system`, `report-creation-guide`, `test-inventory`, `module-inventory` y los índices.

**Nuevo material**: skills `mis-winder-ant` y `mis-reportes-bloques`; agentes 4 (contratos y gobierno de datos) y 5 (seguridad y rendimiento); documentos `winder-transport`, `naming-conventions`, `quality-gates`; tres ADR; workflow de CI.

**Scripts**: librería compartida `lib/proyecto.mjs` (un solo recorrido del árbol en vez de cuatro); `validar-gobernanza.mjs` reescrito como motor de 14 reglas con niveles, `--json`, filtro por regla y línea base; `crear-modulo.mjs` alineado al código real y con módulo generado que compila, pasa 12 pruebas y no produce hallazgos; `verificar-bundle.mjs` con control de source maps, tokens y presupuesto; `ejecutar-pruebas.mjs` con cadenas `verificar` y `ci`; nuevos `generar-inventario.mjs` y `validar-documentacion.mjs`.

## Reorganización del gobierno del dato

La segunda parte de esta auditoría reordenó `governance/docs/` alrededor del dato. El diagnóstico: el gobierno del dato existía **disperso en ocho carpetas** y sin dueño documental, mientras el índice lo simulaba con una lista de enlaces.

| Problema | Corrección |
|---|---|
| El gobierno del dato no tenía área propia | Nueva `data/` con siete documentos: glosario, catálogo, contratos, linaje, calidad, clasificación y responsabilidades |
| No existía catálogo de qué datos consume el sistema | `data/catalog.md` con los **206 `cod_rep`** derivados del código por `generar-inventario.mjs` |
| No existía linaje ni registro de dónde se corrompe una cifra | `data/lineage.md` con los cinco puntos de corrupción y el procedimiento de trazado inverso |
| El [modelo de amenazas](../../security/threat-model.md) exigía un inventario de campos sensibles que no existía | `data/classification.md` con cuatro niveles y el inventario, marcando explícitamente lo que falta |
| Nadie respondía por un dato dudoso | `data/stewardship.md` con roles, matriz de decisión y escalamiento |
| Los contratos vivían bajo `architecture/` | Movidos a `data/contracts/`: describen el dato, no la aplicación |
| `reports/` significaba "evidencia" en un sistema cuyo dominio central se llama "reportes" | Renombrada a `evidence/` |
| `states/` y `features/` eran carpetas de dos archivos; las plantillas estaban en tres lugares | Disueltas; todas las plantillas en `templates/` |
| `style-guide.md` duplicaba `conventions.md` | Absorbido |

Enlaces reescritos: 72. Verificado con `npm run audit:docs`: **0 referencias rotas, 0 huérfanos**.

Se agregó además una quinta comprobación al validador: **las reglas del auditor citan la norma que las justifica**, y ahora se verifica que ese documento exista. Sin eso, mover un documento dejaba hallazgos apuntando al vacío — que es exactamente lo que esta reorganización habría provocado.

## Evidencia

```bash
node governance/scripts/validar-gobernanza.mjs --json      # 7 errores, 122 avisos sobre 1224 archivos
node governance/scripts/validar-documentacion.mjs          # 0 referencias rotas
node governance/scripts/generar-inventario.mjs --json      # 12 módulos, 349 specs, 29 suites E2E, 206 cod_rep
npm run verify                                             # cadena estática completa
```

Las cifras de este informe corresponden al commit evaluado. Para regenerarlas, correr los comandos de arriba — no copiarlas de acá.

## Acciones pendientes

| Acción | Responsable | Prioridad |
|---|---|---|
| Resolver C1 y C2 moviendo lo compartido a `core/` o `shared/` | Arquitectura frontend | Alta |
| Reemplazar el correo real de C3 por un ejemplo genérico | Cualquiera | Alta (trivial) |
| Cubrir con specs los servicios de C4, empezando por los de `reportes` | QA | Media |
| Decidir sobre G1 y G2 (ESLint, `strict`) mediante ADR | Arquitectura frontend | Media |
| Completar los estados de C7 | Desarrollo | Media |
| Eliminar el directorio vacío de C9 | Cualquiera | Baja |
| **Asignar propietario funcional por dominio** en el catálogo de datos | Negocio | Alta |
| Completar el inventario de campos sensibles por contrato | Seguridad + negocio | Media |

---

## Seguimiento

**2026-09-08 — C1 baja de 5 a 3 casos.** `core/recientes/` se movió al módulo
Home y `core/preferencias/` al layout: los dos imports de `recientes` a
`MenuStgService` y `SEGMENTO_LABELS` dejaron de ser una violación, porque ya no
es `core` quien conoce la pantalla. Los 3 restantes son de los interceptores y
siguen abiertos. Detalle en [preferencias y sesión](../../architecture/session-preferences.md).
