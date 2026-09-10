# Compuertas de calidad

Qué se verifica, con qué comando, y qué bloquea.

## Comandos

| Comando | Qué hace | Bloquea |
|---|---|---|
| `npm run verify` | gobernanza + documentación + tokens + inventarios + anclas de tour + activos. Segundos, sin compilar. | sí, ante hallazgo nuevo |
| `npm run verify:ci` | lo anterior + unitarias + build + control de bundle | sí |
| `npm run verify:ci -- --con-e2e` | además Playwright en los dos viewports | sí |
| `npm run audit:governance` | solo el auditor de arquitectura | informativo si no lleva `--check` |
| `npm run audit:docs` | enlaces y referencias de `governance/` | informativo sin `--check` |
| `npm run tokens:check` | `tokens.paleta.ts` sincronizado con `tokens.css` | sí |
| `npm run inventario:check` | inventarios derivados al día | sí |
| `npm run audit:anclas` | los pasos de los recorridos guiados apuntan a algo que existe | sí con `--check` |
| `npm run audit:activos` | `src/assets`: referenciados que faltan, huérfanos y peso | sí con `--check` |
| `npm test` | unitarias (Vitest) | sí |
| `npm run e2e` | end-to-end (Playwright) | sí |
| `npm run build:prod` | build de producción + `verify:bundle` | sí |

`npm run verify` es la que conviene correr antes de cada commit.

## Las seis fases de la cadena estática

| Fase | Qué protege | Modo de falla que evita |
|---|---|---|
| Gobernanza | invariantes de arquitectura y seguridad | un import que rompe el aislamiento de capas |
| Documentación | que `governance/` describa el código | una guía que enseña una ruta o una clase que ya no existe |
| Tokens | `tokens.paleta.ts` sincronizado con `tokens.css` | editar un token y dejar los tests de contraste midiendo el valor viejo |
| Inventarios | módulos, pruebas y `cod_rep` derivados del código | un inventario que cuenta un módulo retirado |
| Anclas de tour | los recorridos guiados apuntan a algo real | driver.js saltea el paso en silencio y nadie se entera |
| Activos | `src/assets` referenciado y acotado | una imagen que devuelve 404, o megabytes que nadie usa |

Las dos últimas cubren modos de falla **silenciosos**: no rompen la compilación ni ninguna prueba, así que sin compuerta llegan a producción.

## El auditor de gobernanza

`validar-gobernanza.mjs` es un motor de reglas. Cada regla declara id, nivel, qué verifica, **por qué** y a qué documento responde:

```bash
node governance/scripts/validar-gobernanza.mjs --listar          # catálogo con su porqué
node governance/scripts/validar-gobernanza.mjs --regla=core-aislado
node governance/scripts/validar-gobernanza.mjs --json            # para herramientas
```

| Nivel | Significado | Efecto |
|---|---|---|
| `error` | invariante de arquitectura o seguridad rota | falla con `--check` |
| `aviso` | deuda o desvío de convención | falla solo con `--estricto` |

### Reglas vigentes

**Errores**: `core-aislado`, `shared-aislado`, `modulos-desacoplados`, `sin-secretos`, `control-flujo-moderno`.

**Avisos**: `entrada-salida-señal`, `nombres-canonicos`, `tokens-de-color`, `entorno-fuera-de-core`, `prueba-vecina`, `estados-de-datos`, `error-no-silenciado`, `sin-console`, `rutas-lazy`.

### Línea base

El repositorio arrastra deuda anterior a estas reglas. Exigir "cero hallazgos" hoy paralizaría el trabajo; ignorarlos la haría crecer. La solución es congelarla:

```bash
node governance/scripts/validar-gobernanza.mjs --guardar-linea-base   # congela lo conocido
node governance/scripts/validar-gobernanza.mjs --linea-base --check   # exige cero NUEVOS
```

`governance/gobernanza.linea-base.json` guarda las claves de los hallazgos ya existentes. **Se regenera a propósito**, nunca en automático: regenerarla para "arreglar" el pipeline es esconder la deuda, no pagarla.

El pipeline y `npm run verify` usan la línea base por defecto. Para ver el pasivo completo: `--sin-linea-base`.

## El validador de documentación

`validar-documentacion.mjs` verifica cinco cosas sobre `governance/`:

1. Enlaces internos rotos.
2. Rutas de código citadas que ya no existen.
3. Símbolos y tokens de diseño nombrados en las guías que no aparecen en `src/`.
4. Reglas del auditor que citan una norma inexistente — un hallazgo cuyo documento se movió deja de poder discutirse contra algo escrito.
5. Documentos que ningún otro enlaza.

El punto 3 existe por un caso concreto: una skill documentaba una paleta completa de clases (`bg-surface-card`, `text-text-primary`) que nunca existió en el proyecto. Quien la copiaba obtenía una pantalla sin estilos, y ninguna prueba lo detectaba porque el código compilaba.

Las guías pueden nombrar un antipatrón: el validador no reporta una cita cuya línea la señala como incorrecta.

## Cómo se relaciona con el gobierno del dato

Cuatro reglas del auditor existen para proteger la cifra, no el estilo del código: `error-no-silenciado` (un fallo del backend no se muestra como tabla vacía), `estados-de-datos` (una vista que carga contempla el error), `sin-secretos` (nada de identidades ni entornos reales) y `nombres-canonicos` (constantes, modelos y mapeos en su capa). El detalle está en [calidad del dato](../data/quality.md).

## Inventarios derivados

Las cifras que envejecen solas no se escriben a mano. `generar-inventario.mjs` deriva del código el inventario de módulos y rutas, el catálogo de códigos `cod_rep` y las cifras de pruebas, y los inyecta entre marcadores en los `.md`, dejando intacta la prosa:

```bash
npm run inventario         # regenera
npm run inventario:check   # falla si quedaron viejos
```

## Pipeline

`.github/workflows/ci.yml` corre cuatro jobs: gobernanza y documentación, unitarias, build con control de bundle, y E2E (que depende de los dos primeros por ser el más caro). Es el mismo contenido de `npm run verify:ci`, para que un rojo en CI se reproduzca en local con un solo comando.

## Lo que todavía no está cubierto

Nombrarlo evita afirmar una cobertura que no existe:

- **No hay ESLint** configurado en el proyecto. El auditor de gobernanza cubre reglas de arquitectura, no de estilo de código.
- **`tsconfig.json` no tiene `strict: true`.** Están activadas `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns` y `noFallthroughCasesInSwitch`, pero no el modo estricto completo.
- **No hay verificación automatizada de rutas contra menú.** El catálogo enumera los `cod_rep` declarados, pero no verifica que cada uno esté efectivamente en uso ni que no haya duplicados entre dominios.
- **La autorización real no se prueba**: el E2E mockea el backend por diseño.
