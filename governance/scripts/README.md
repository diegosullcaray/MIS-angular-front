# Scripts de gobernanza — MIS Host

Automatización del ciclo de desarrollo. Todos corren en Windows, Linux, macOS y CI, sin dependencias fuera de las del proyecto.

Comparten [`lib/proyecto.mjs`](./lib/proyecto.mjs): el árbol de `src/app` se recorre **una vez** y se cachea, con las mismas exclusiones y el mismo formato de salida para todos.

## Índice

| Script | Propósito | npm |
|---|---|---|
| [`ejecutar-pruebas.mjs`](./ejecutar-pruebas.mjs) | lanzador único de pruebas, auditorías y cadenas | `npm run test:runner` |
| [`validar-gobernanza.mjs`](./validar-gobernanza.mjs) | motor de reglas de arquitectura y seguridad | `npm run audit:governance` |
| [`validar-documentacion.mjs`](./validar-documentacion.mjs) | referencias rotas en `governance/` | `npm run audit:docs` |
| [`generar-inventario.mjs`](./generar-inventario.mjs) | inventarios derivados del código | `npm run inventario` |
| [`crear-modulo.mjs`](./crear-modulo.mjs) | scaffolding de módulos | `npm run module:create` |
| [`verificar-bundle.mjs`](./verificar-bundle.mjs) | control del artefacto de producción | `npm run verify:bundle` |
| [`generar-tokens-paleta.mjs`](./generar-tokens-paleta.mjs) | tokens CSS → TypeScript | `npm run tokens` |

---

## 1. Lanzador de verificación

```bash
node governance/scripts/ejecutar-pruebas.mjs help
```

**Pruebas**: `unit [ruta]`, `watch`, `coverage`, `e2e [ruta]`, `e2e:ui`, `e2e:report`.
**Gobernanza**: `gobernanza`, `documentacion`, `tokens`, `inventario`.
**Artefacto**: `compilar`, `bundle`.
**Cadenas**: `verificar` (estático, pre-commit) y `ci` (la del pipeline; `--con-e2e` suma Playwright).

Las cadenas informan la duración de cada fase, se detienen en la primera que falla e indican **qué comando reproduce ese fallo por separado**.

```bash
node governance/scripts/ejecutar-pruebas.mjs verificar
node governance/scripts/ejecutar-pruebas.mjs unit src/app/pages/modules/analista
node governance/scripts/ejecutar-pruebas.mjs ci --con-e2e
```

---

## 2. Auditor de gobernanza

Motor de 14 reglas sobre `src/app`. Cada una declara id, nivel, qué verifica, **por qué** y a qué documento de `governance/docs/` responde.

```bash
node governance/scripts/validar-gobernanza.mjs                  # informe
node governance/scripts/validar-gobernanza.mjs --listar         # catálogo con su porqué
node governance/scripts/validar-gobernanza.mjs --check          # falla ante errores (CI)
node governance/scripts/validar-gobernanza.mjs --estricto       # falla también con avisos
node governance/scripts/validar-gobernanza.mjs --json           # salida para herramientas
node governance/scripts/validar-gobernanza.mjs --regla=core-aislado,sin-secretos
```

**Errores** (rompen una invariante): `core-aislado`, `shared-aislado`, `modulos-desacoplados`, `sin-secretos`, `control-flujo-moderno`.

**Avisos** (deuda o convención): `entrada-salida-señal`, `nombres-canonicos`, `tokens-de-color`, `entorno-fuera-de-core`, `prueba-vecina`, `estados-de-datos`, `error-no-silenciado`, `sin-console`, `rutas-lazy`.

### Línea base

```bash
node governance/scripts/validar-gobernanza.mjs --guardar-linea-base   # congelar (deliberado)
node governance/scripts/validar-gobernanza.mjs --linea-base --check   # exigir cero NUEVOS
node governance/scripts/validar-gobernanza.mjs --sin-linea-base       # ver el pasivo completo
```

Congela la deuda anterior a estas reglas para poder exigir "cero hallazgos nuevos" desde el primer día. **Regenerarla para destrabar un pipeline rojo es esconder deuda**: ver [ADR-0003](../docs/architecture/adr/ADR-0003-linea-base-de-gobernanza.md).

---

## 3. Validador de documentación

```bash
node governance/scripts/validar-documentacion.mjs [--check] [--json]
```

Verifica enlaces internos, rutas de código citadas entre backticks, símbolos y tokens de diseño nombrados en las guías que no existen en `src/`, reglas del auditor que citan una norma inexistente, y documentos huérfanos. Una cita señalada explícitamente como incorrecta no se reporta: las guías tienen que poder nombrar un antipatrón.

---

## 4. Inventarios derivados

```bash
node governance/scripts/generar-inventario.mjs           # reescribe los .md
node governance/scripts/generar-inventario.mjs --check    # falla si quedaron viejos
node governance/scripts/generar-inventario.mjs --json     # datos crudos
```

Deriva del código y reinyecta entre marcadores `<!-- generado:inicio … -->` / `<!-- generado:fin -->`, dejando intacta la prosa alrededor:

| Bloque | Destino |
|---|---|
| módulos y rutas | `docs/architecture/module-inventory.md` |
| cifras de pruebas | `docs/development/test-inventory.md` |
| catálogo de `cod_rep` | `docs/data/catalog.md` |

El catálogo de `cod_rep` extrae los códigos de reporte de los `constantes/*.constantes.ts`: es el inventario de qué datos consume el frontend, y estaba repartido en 20 archivos sin que nadie pudiera enumerarlo.

---

## 5. Generador de módulos

```bash
node governance/scripts/crear-modulo.mjs <nombre> [opciones]
```

| Opción | Efecto |
|---|---|
| `--title "<título>"` | título legible de la pantalla |
| `--cod-rep <código>` | código de reporte del backend Ant |
| `--transporte=ant\|http` | fachada de datos (por defecto `ant`) |
| `--registrar-ruta` | enlaza el módulo en `src/app/app.routes.ts` |
| `--dry-run` | simula sin escribir |
| `--force` | sobrescribe un módulo existente |

Genera:

```text
src/app/pages/modules/<modulo>/
  <modulo>.routes.ts
  constantes/<modulo>.constantes.ts
  models/<modulo>.model.ts
  utils/<modulo>.util.ts + .spec.ts
  services/<modulo>.service.ts + .spec.ts
  ui/<modulo>-resumen-card/…
  components/principal/… + .spec.ts
```

El servicio habla con un `Mod*Service` de `core/winder/instances/` — **el sistema no expone REST**, y un servicio contra `/api/<modulo>` compila y nunca trae datos. La pantalla usa los componentes de estado de `shared/ui` y los tokens `--mis-*`. Los specs generados ya cubren datos, vacío legítimo, fallo de backend y payload malformado.

```bash
node governance/scripts/crear-modulo.mjs auditoria-riesgos --title "Auditoría de Riesgos" --cod-rep RS_AUD_01 --registrar-ruta
node governance/scripts/crear-modulo.mjs auditoria-riesgos --dry-run
```

---

## 6. Control del bundle

```bash
node governance/scripts/verificar-bundle.mjs [--dir=dist/mis-host/browser] [--json]
```

Falla si el artefacto de producción contiene identidades de prueba, hosts locales, source maps enlazados o cadenas con forma de JWT. Además registra el peso inicial contra el presupuesto de `angular.json`, para que una regresión de tamaño se vea en el log del build.

No puede proteger los secretos Winder: están compilados en `src/environments/` y viajan en el bundle. Solo detecta filtraciones **nuevas** — ver [hallazgos de seguridad](../docs/security/findings.md).

---

## 7. Tokens de paleta

```bash
node governance/scripts/generar-tokens-paleta.mjs           # regenera
node governance/scripts/generar-tokens-paleta.mjs --check   # verifica
```

Extrae los tokens de color de `src/app/theme/tokens.css` (fuente de verdad) hacia `tokens.paleta.ts`, que consumen los tests de contraste y daltonismo. La comparación normaliza fin de línea: sin eso, un checkout de Windows con `core.autocrlf` daba desactualizado un archivo idéntico.
