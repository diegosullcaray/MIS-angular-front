#!/usr/bin/env node
/**
 * Regenera los inventarios que se desactualizan solos — MIS Host.
 *
 * `module-inventory.md` y `test-inventory.md` contenían tablas y cifras
 * escritas a mano ("349 specs", "29 suites"). Un número copiado envejece en el
 * primer commit siguiente y después nadie sabe si el documento miente. Acá se
 * derivan del código y se inyectan entre marcadores, dejando intacta la prosa
 * que sí es criterio humano.
 *
 * Marcadores en el `.md`:
 *   <!-- generado:inicio <clave> -->  …contenido reemplazable…  <!-- generado:fin -->
 *
 * Uso:
 *   node governance/scripts/generar-inventario.mjs           reescribe los .md
 *   node governance/scripts/generar-inventario.mjs --check   falla si quedaron viejos (CI)
 *   node governance/scripts/generar-inventario.mjs --json    vuelca los datos crudos
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';
import { execSync } from 'node:child_process';
import { listarArchivos, opciones, titulo, verde, rojo, gris, RAIZ, SRC_APP, E2E } from './lib/proyecto.mjs';

const { flags } = opciones();

/* ── Recolección ──────────────────────────────────────────── */

function commitActual() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return 'sin-git';
  }
}

/** Rutas hijas de `app` en `app.routes.ts`, con el módulo que cargan. */
function rutasDeApp() {
  const fuente = readFileSync(resolve(SRC_APP, 'app.routes.ts'), 'utf8');
  const rutas = [];
  // Se busca cada lazy import de un módulo y se retrocede hasta el `path:` más
  // cercano. Al revés (path → import) el `path: 'app'` del contenedor se comía
  // el primer hijo, y `home` salía como `/app/app` en vez de `/app/dashboard`.
  const patron = /import\('\.\/pages\/modules\/([^/]+)\/[^']+\.routes'\)/g;
  for (const m of fuente.matchAll(patron)) {
    const previo = fuente.slice(0, m.index);
    const paths = [...previo.matchAll(/path:\s*'([^']*)'/g)];
    const ultimo = paths.at(-1);
    if (ultimo) rutas.push({ ruta: ultimo[1], modulo: m[1] });
  }
  return rutas;
}

/** Todos los `*.routes.ts` de un módulo y cuántos destinos declara cada uno. */
function rutasDelModulo(modulo) {
  const archivos = listarArchivos(resolve(SRC_APP, 'pages/modules', modulo), ['.routes.ts']);
  let destinos = 0;
  for (const archivo of archivos) {
    const contenido = readFileSync(archivo, 'utf8');
    destinos += (contenido.match(/loadComponent:|loadChildren:|component:/g) ?? []).length;
  }
  return { archivosRuta: archivos.length, destinos };
}

function inventarioModulos() {
  const rutas = rutasDeApp();
  return rutas
    .map(({ ruta, modulo }) => {
      const { archivosRuta, destinos } = rutasDelModulo(modulo);
      const ts = listarArchivos(resolve(SRC_APP, 'pages/modules', modulo), ['.ts']);
      return {
        modulo,
        ruta: `/app/${ruta}`,
        archivosRuta,
        destinos,
        pantallas: ts.filter((f) => f.endsWith('.component.ts') && !f.endsWith('.spec.ts')).length,
        servicios: ts.filter((f) => f.endsWith('.service.ts') && !f.endsWith('.spec.ts')).length,
        specs: ts.filter((f) => f.endsWith('.spec.ts')).length,
      };
    })
    .sort((a, b) => a.modulo.localeCompare(b.modulo));
}

function inventarioPruebas() {
  const specsUnit = listarArchivos(SRC_APP, ['.spec.ts']).length;
  const suitesE2e = existsSync(E2E) ? listarArchivos(E2E, ['.spec.ts']).length : 0;

  let proyectosE2e = [];
  try {
    const pw = readFileSync(resolve(RAIZ, 'playwright.config.ts'), 'utf8');
    proyectosE2e = [...pw.matchAll(/name:\s*'([^']+)'/g)].map((m) => m[1]);
  } catch {
    /* sin config de Playwright */
  }

  return { specsUnit, suitesE2e, proyectosE2e };
}

/**
 * Catálogo de códigos de reporte (`cod_rep`) declarados en `constantes/`.
 *
 * Es el activo de datos más concreto del sistema: cada código identifica una
 * consulta del backend Ant. Estaban repartidos en 20 archivos sin que nadie
 * pudiera responder "qué datos consume este frontend" sin recorrerlos a mano.
 */
function inventarioCodRep() {
  const archivos = listarArchivos(SRC_APP, ['.constantes.ts']);
  const entradas = [];

  for (const archivo of archivos) {
    const ruta = relative(RAIZ, archivo).split(sep).join('/');
    const contenido = readFileSync(archivo, 'utf8');

    // `export const COD_X = 'CODIGO'` y `export const COD_X = { clave: 'CODIGO', … }`
    for (const m of contenido.matchAll(/export const (COD_[A-Z0-9_]+)\s*=\s*(\{[\s\S]*?\n\}|'[^']+')/g)) {
      const codigos = [...m[2].matchAll(/'([A-Za-z0-9_/]{4,})'/g)].map((c) => c[1]);
      if (codigos.length === 0) continue;
      entradas.push({ constante: m[1], ruta, dominio: dominioDe(ruta), codigos });
    }
  }

  const codigos = new Set(entradas.flatMap((e) => e.codigos));
  return { entradas: entradas.sort((a, b) => a.constante.localeCompare(b.constante)), totalCodigos: codigos.size };
}

/**
 * Inventario de rutas de acción del backend Ant (los `strand`) que el frontend
 * consume, con sus parámetros y la clave de respuesta que espera.
 *
 * El catálogo de `cod_rep` responde "qué reportes se piden"; esto responde la
 * otra mitad: **qué le pide el frontend al backend y con qué parámetros**. Vive
 * repartido en los servicios de `core/winder/instances/`, uno por módulo de
 * Ant, y no había forma de enumerarlo sin abrirlos todos.
 */
function inventarioStrands() {
  const archivos = listarArchivos(resolve(SRC_APP, 'core/winder/instances'), ['.ts']).filter(
    (a) => !a.endsWith('.spec.ts')
  );
  const servicios = [];

  for (const archivo of archivos) {
    const ruta = relative(RAIZ, archivo).split(sep).join('/');
    const contenido = readFileSync(archivo, 'utf8');

    const clase = contenido.match(/export class (\w+)/)?.[1] ?? ruta;
    const puerto = contenido.match(/port:\s*(\d+)/)?.[1] ?? '—';
    const appId = contenido.match(/appId:\s*'([^']+)'/)?.[1] ?? '—';

    const llamadas = [];

    // Forma corta: getSimpleResponseString('ruta', { p1, p2 }, 'respuesta')
    const corta = /(getSimpleResponseString|getSimpleResponseStringNP|getSimpleResponseResource|postSimpleResponseString)\(\s*'([^']+)'\s*(?:,\s*(\{[\s\S]*?\})\s*)?(?:,\s*'([^']+)')?/g;
    for (const m of contenido.matchAll(corta)) {
      llamadas.push({
        ruta: m[2],
        verbo: m[1].startsWith('post') ? 'POST' : 'GET',
        parametros: m[3] ? clavesDePayload(m[3]) : [],
        respuesta: m[4] ?? 'response',
        indice: m.index ?? 0,
      });
    }

    // Forma larga: new Strand('ruta', 'respuesta') + pushToPayload('param', …)
    for (const m of contenido.matchAll(/new Strand\(\s*'([^']+)'\s*(?:,\s*'([^']+)')?\s*\)/g)) {
      const desde = m.index ?? 0;
      const hasta = contenido.indexOf('return', desde);
      const cuerpo = contenido.slice(desde, hasta === -1 ? desde + 600 : hasta);
      llamadas.push({
        ruta: m[1],
        verbo: /this\.post/.test(contenido.slice(desde, desde + 900)) ? 'POST' : 'GET',
        parametros: [...cuerpo.matchAll(/pushToPayload\(\s*'([^']+)'/g)].map((p) => p[1]),
        respuesta: m[2] ?? 'response',
        indice: desde,
      });
    }

    if (llamadas.length === 0) continue;

    // Cada llamada se atribuye al método público que la contiene.
    const metodos = [...contenido.matchAll(/public (\w+)\(/g)].map((m) => ({ nombre: m[1], indice: m.index ?? 0 }));
    for (const llamada of llamadas) {
      const previos = metodos.filter((m) => m.indice < llamada.indice);
      llamada.metodo = previos.length ? previos[previos.length - 1].nombre : '—';
    }

    servicios.push({
      clase,
      ruta,
      appId,
      puerto,
      llamadas: llamadas.sort((a, b) => a.ruta.localeCompare(b.ruta)),
    });
  }

  const rutas = new Set(servicios.flatMap((s) => s.llamadas.map((l) => l.ruta)));
  return { servicios: servicios.sort((a, b) => a.clase.localeCompare(b.clase)), totalRutas: rutas.size };
}

/**
 * Claves declaradas en un objeto de payload literal, en orden.
 *
 * Contempla las dos formas del repo: explícita (`cod_rel: codRel`) y abreviada
 * (`{ tip_cod, cod_rel, fec }`). Mirar solo `nombre:` perdía silenciosamente
 * los parámetros abreviados — y `fec`, la fecha de corte, casi siempre se
 * escribe así.
 */
function clavesDePayload(texto) {
  const cuerpo = texto.trim().replace(/^\{/, '').replace(/\}$/, '');
  const claves = [];
  let nivel = 0;
  let actual = '';

  const cerrar = () => {
    const pieza = actual.trim();
    if (pieza) {
      const clave = pieza.split(':')[0].trim();
      if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(clave)) claves.push(clave);
    }
    actual = '';
  };

  for (const caracter of cuerpo) {
    if ('{[('.includes(caracter)) nivel++;
    if ('}])'.includes(caracter)) nivel--;
    if (caracter === ',' && nivel === 0) {
      cerrar();
      continue;
    }
    actual += caracter;
  }
  cerrar();

  return claves;
}

/** Dominio funcional legible a partir de la ruta del archivo de constantes. */
function dominioDe(ruta) {
  const modulo = ruta.match(/pages\/modules\/([^/]+)\//)?.[1] ?? 'core';
  if (modulo !== 'reportes') return modulo;
  // En `reportes`, el subdominio y la agrupación son lo que identifica al dato.
  const partes = ruta.split('/');
  const i = partes.indexOf('components');
  const sub = partes[i + 1];
  // `partes[i + 3]` es la agrupación solo cuando hay un nivel `components/`
  // intermedio; si ahí ya está `constantes/` o el archivo, el subdominio basta.
  const grupo = partes[i + 3];
  const esAgrupacion = grupo && grupo !== 'constantes' && !grupo.endsWith('.ts');
  return esAgrupacion ? `reportes / ${sub} / ${grupo}` : `reportes / ${sub}`;
}

/* ── Render ───────────────────────────────────────────────── */

function tablaModulos(modulos) {
  const filas = modulos
    .map(
      (m) =>
        `| \`${m.modulo}\` | \`${m.ruta}\` | ${m.archivosRuta} | ${m.destinos} | ${m.pantallas} | ${m.servicios} | ${m.specs} |`
    )
    .join('\n');
  return [
    '| Módulo | Ruta base | Archivos `*.routes.ts` | Destinos de ruta | Componentes | Servicios | Specs |',
    '|---|---|---:|---:|---:|---:|---:|',
    filas,
    '',
    `_Total: ${modulos.length} módulos enlazados desde \`app.routes.ts\`._`,
  ].join('\n');
}

function tablaCodRep(cat) {
  const filas = cat.entradas
    .map((e) => `| ${e.dominio} | \`${e.constante}\` | ${e.codigos.length} | ${e.codigos.map((c) => `\`${c}\``).join(', ')} |`)
    .join('\n');
  return [
    '| Dominio | Constante | Códigos | `cod_rep` declarados |',
    '|---|---|---:|---|',
    filas,
    '',
    `_${cat.totalCodigos} códigos únicos en ${cat.entradas.length} constantes._`,
  ].join('\n');
}

function tablaStrands(inv) {
  const filas = inv.servicios
    .flatMap((s) =>
      s.llamadas.map(
        (l) =>
          `| \`${s.appId}\` (${s.puerto}) | \`${s.clase}\` | \`${l.metodo}\` | \`${l.ruta}\` | ${l.verbo} | ${
            l.parametros.length ? l.parametros.map((p) => `\`${p}\``).join(', ') : '—'
          } | \`${l.respuesta}\` |`
      )
    )
    .join('\n');
  return [
    '| Módulo Ant | Servicio | Método | Ruta de acción | Verbo | Parámetros de payload | Clave de respuesta |',
    '|---|---|---|---|---|---|---|',
    filas,
    '',
    `_${inv.totalRutas} rutas de acción únicas en ${inv.servicios.length} servicios de \`core/winder/instances/\`._`,
  ].join('\n');
}

function bloquePruebas(p) {
  return [
    `- **${p.specsUnit}** archivos \`*.spec.ts\` bajo \`src/app\`.`,
    `- **${p.suitesE2e}** suites Playwright bajo \`e2e/\`.`,
    `- Proyectos E2E configurados: ${p.proyectosE2e.map((n) => `\`${n}\``).join(', ') || '—'}.`,
  ].join('\n');
}

/* ── Inyección en los .md ─────────────────────────────────── */

/**
 * Compara solo los DATOS, nunca el sello.
 *
 * El sello lleva fecha y commit, así que compararlo entero hacía que
 * `--check` fallara en cada commit aunque el inventario fuera idéntico. Un
 * gate que grita en falso se termina ignorando, y entonces deja de proteger
 * el caso real. También se normaliza el fin de línea, porque un checkout de
 * Windows con `core.autocrlf` guarda CRLF y este script escribe LF.
 */
const soloDatos = (bloque) =>
  bloque
    .replace(/<!-- Generado por [^>]*-->/g, '')
    .replace(/\r\n/g, '\n')
    .trim();

function inyectar(rutaDoc, clave, cuerpo, sello) {
  const absoluta = resolve(RAIZ, rutaDoc);
  if (!existsSync(absoluta)) return { rutaDoc, estado: 'ausente' };

  const original = readFileSync(absoluta, 'utf8');
  const inicio = `<!-- generado:inicio ${clave} -->`;
  const fin = '<!-- generado:fin -->';
  const patron = new RegExp(`${inicio}[\\s\\S]*?${fin}`);

  const actual = original.match(patron);
  if (!actual) return { rutaDoc, estado: 'sin-marcador' };

  const reemplazo = `${inicio}\n<!-- Generado por governance/scripts/generar-inventario.mjs — ${sello}. No editar a mano. -->\n\n${cuerpo}\n${fin}`;

  if (soloDatos(actual[0]) === soloDatos(reemplazo)) return { rutaDoc, estado: 'al-dia' };
  if (!flags['check']) writeFileSync(absoluta, original.replace(patron, reemplazo));
  return { rutaDoc, estado: 'desactualizado' };
}

/* ── Main ─────────────────────────────────────────────────── */

const modulos = inventarioModulos();
const pruebas = inventarioPruebas();
const codRep = inventarioCodRep();
const strands = inventarioStrands();
const sello = `${new Date().toISOString().slice(0, 10)} · commit ${commitActual()}`;

if (flags['json']) {
  console.log(JSON.stringify({ sello, modulos, pruebas, codRep, strands }, null, 2));
  process.exit(0);
}

const resultados = [
  inyectar('governance/docs/architecture/module-inventory.md', 'modulos', tablaModulos(modulos), sello),
  inyectar('governance/docs/development/test-inventory.md', 'pruebas', bloquePruebas(pruebas), sello),
  inyectar('governance/docs/data/catalog.md', 'cod-rep', tablaCodRep(codRep), sello),
  inyectar('governance/docs/data/contracts/action-routes.md', 'rutas-de-accion', tablaStrands(strands), sello),
];

titulo('Inventario derivado del código', sello);
console.log(`Módulos enlazados: ${modulos.length}`);
console.log(`Specs unitarias:   ${pruebas.specsUnit}`);
console.log(`Rutas de acción:   ${strands.totalRutas}`);
console.log(`Suites E2E:        ${pruebas.suitesE2e}\n`);

let desfase = false;
for (const { rutaDoc, estado } of resultados) {
  const glifo = { 'al-dia': verde('✓'), desactualizado: flags['check'] ? rojo('✗') : verde('↻'), 'sin-marcador': rojo('✗'), ausente: rojo('✗') }[estado];
  console.log(`${glifo} ${rutaDoc} ${gris(`(${estado})`)}`);
  if (estado !== 'al-dia') desfase = true;
}

if (flags['check'] && desfase) {
  console.error(rojo('\n✗ Los inventarios no reflejan el código. Corré: npm run inventario\n'));
  process.exit(1);
}

console.log('');
process.exit(0);
