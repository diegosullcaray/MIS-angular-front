/**
 * Utilidades compartidas por los scripts de gobernanza de MIS Host.
 *
 * Antes cada script recorría `src/app` por su cuenta (el auditor lo hacía
 * cuatro veces seguidas). Acá el árbol se lee UNA vez, se cachea en memoria y
 * todos los scripts consumen el mismo índice, con las mismas exclusiones y el
 * mismo formato de salida.
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

export const RAIZ = process.cwd();
export const SRC = resolve(RAIZ, 'src');
export const SRC_APP = resolve(SRC, 'app');
export const E2E = resolve(RAIZ, 'e2e');
export const GOVERNANCE = resolve(RAIZ, 'governance');

/** Carpetas que ningún script debe recorrer. */
const EXCLUIDAS = new Set(['node_modules', 'dist', '.git', '.angular', 'coverage', 'playwright-report', 'test-results']);

/** Ruta siempre con `/`, relativa a la raíz del repo: comparable en Windows y en CI. */
export function rutaRel(absoluta) {
  return relative(RAIZ, absoluta).split(sep).join('/');
}

function recorrer(dir, extensiones, acumulado) {
  let entradas;
  try {
    entradas = readdirSync(dir);
  } catch {
    return acumulado;
  }
  for (const entrada of entradas) {
    if (EXCLUIDAS.has(entrada)) continue;
    const completa = join(dir, entrada);
    let info;
    try {
      info = statSync(completa);
    } catch {
      continue;
    }
    if (info.isDirectory()) recorrer(completa, extensiones, acumulado);
    else if (extensiones.some((ext) => entrada.endsWith(ext))) acumulado.push(completa);
  }
  return acumulado;
}

/** Lista de rutas absolutas bajo `dir` con alguna de las extensiones dadas. */
export function listarArchivos(dir, extensiones = ['.ts']) {
  return recorrer(dir, extensiones, []);
}

const cacheIndice = new Map();

/**
 * Índice de `src/app`: cada entrada trae ruta relativa, contenido y banderas de
 * clasificación ya calculadas, para que las reglas no repitan `includes()`.
 */
export function indexarApp(extensiones = ['.ts', '.html', '.css']) {
  const clave = extensiones.join('|');
  if (cacheIndice.has(clave)) return cacheIndice.get(clave);

  const archivos = listarArchivos(SRC_APP, extensiones).map((absoluta) => {
    const ruta = rutaRel(absoluta);
    return {
      absoluta,
      ruta,
      contenido: readFileSync(absoluta, 'utf8'),
      esSpec: ruta.endsWith('.spec.ts'),
      esComponente: ruta.endsWith('.component.ts'),
      esPlantilla: ruta.endsWith('.html'),
      esEstilo: ruta.endsWith('.css'),
      capa: capaDe(ruta),
      modulo: moduloDe(ruta),
    };
  });

  cacheIndice.set(clave, archivos);
  return archivos;
}

/** `core` | `shared` | `pages` | `theme` | `otro`. */
export function capaDe(ruta) {
  const m = ruta.match(/^src\/app\/(core|shared|pages|theme)\//);
  return m ? m[1] : 'otro';
}

/** Nombre del módulo de negocio (`src/app/pages/modules/<modulo>/…`) o `null`. */
export function moduloDe(ruta) {
  const m = ruta.match(/^src\/app\/pages\/modules\/([^/]+)\//);
  return m ? m[1] : null;
}

/** Número de línea (1-based) de la posición `indice` dentro de `contenido`. */
export function lineaDe(contenido, indice) {
  return contenido.slice(0, indice).split('\n').length;
}

/** Todas las coincidencias de `patron` con su línea. `patron` debe ser global. */
export function coincidencias(contenido, patron) {
  return [...contenido.matchAll(patron)].map((m) => ({
    texto: m[0],
    linea: lineaDe(contenido, m.index ?? 0),
  }));
}

/* ── Rutas de la aplicación ───────────────────────────────── */

const MODULOS = resolve(SRC_APP, 'pages/modules');
const escaparRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Carpetas de `src/app/pages/modules/`: un módulo por carpeta. */
export function modulosDeNegocio() {
  try {
    return readdirSync(MODULOS).filter((n) => statSync(join(MODULOS, n)).isDirectory()).sort();
  } catch {
    return [];
  }
}

/**
 * Módulos que ninguna ruta carga.
 *
 * Un módulo queda enlazado si `app.routes.ts` o el `*.routes.ts` de OTRO módulo
 * lo importa en diferido. Una carpeta sin enlace compila y pasa sus pruebas,
 * pero nadie puede abrirla: es código muerto que parece vivo.
 */
export function modulosSinRuta() {
  const rutas = listarArchivos(SRC_APP, ['.routes.ts']).map((f) => ({ ruta: rutaRel(f), contenido: readFileSync(f, 'utf8') }));
  return modulosDeNegocio().filter((modulo) => {
    const propio = `src/app/pages/modules/${modulo}/`;
    const referencia = new RegExp(`(pages/modules/|\\.\\./)${escaparRegex(modulo)}/`);
    return !rutas.some((r) => !r.ruta.startsWith(propio) && referencia.test(r.contenido));
  });
}

/** Cada `path:` declarado en algún `*.routes.ts`, como patrón (`:param` acepta un segmento). */
export function patronesDeRuta() {
  const paths = new Set();
  for (const f of listarArchivos(SRC_APP, ['.routes.ts'])) {
    for (const m of readFileSync(f, 'utf8').matchAll(/path:\s*'([^']*)'/g)) {
      if (m[1] && m[1] !== '**' && m[1] !== 'app') paths.add(m[1]);
    }
  }
  return [...paths].map(
    (p) => new RegExp(`^${p.split('/').map((s) => (s.startsWith(':') ? '[^/]+' : escaparRegex(s))).join('/')}$`)
  );
}

/**
 * ¿La URL `/app/…` termina en alguna ruta declarada?
 *
 * Las rutas se componen por módulo (`reportes` + `leg/com/rda/adm/x`), así que
 * basta con que algún sufijo de la URL coincida con un `path:`. No reconstruye
 * el árbol completo: detecta rutas borradas o mal escritas, que caerían en el
 * comodín `**` y harían pasar una prueba sin abrir la pantalla que nombra.
 */
export function rutaDeclarada(url, patrones) {
  const limpia = url.replace(/[?#].*$/, '').replace(/^\/app\/?/, '').replace(/\/$/, '');
  if (!limpia) return true;
  const segmentos = limpia.split('/');
  return segmentos.some((_, i) => patrones.some((p) => p.test(segmentos.slice(i).join('/'))));
}

export function existe(rutaRelativa) {
  return existsSync(resolve(RAIZ, rutaRelativa));
}

export function leer(rutaRelativa) {
  return readFileSync(resolve(RAIZ, rutaRelativa), 'utf8');
}

/* ── Presentación ─────────────────────────────────────────── */

const COLOR =
  process.env['NO_COLOR'] || process.env['CI'] ? () => (t) => t : (c) => (t) => `[${c}m${t}[0m`;
export const rojo = COLOR(31);
export const verde = COLOR(32);
export const amarillo = COLOR(33);
export const gris = COLOR(90);
export const negrita = COLOR(1);

export function titulo(texto, subtitulo) {
  console.log(`\n${negrita(texto)}`);
  if (subtitulo) console.log(gris(subtitulo));
  console.log(gris('─'.repeat(Math.max(texto.length, (subtitulo ?? '').length))));
}

/**
 * Parser mínimo: `--flag` → true, `--clave=valor` → 'valor'.
 *
 * `conValor` lista las claves que además admiten la forma separada
 * (`--title "Mi Módulo"`). Es explícita a propósito: consumir el token
 * siguiente de cualquier flag haría que `unit --watch src/app/x` se tragara la
 * ruta como si fuera el valor de `--watch`.
 */
export function opciones(argv = process.argv.slice(2), conValor = []) {
  const admiteValor = new Set(conValor);
  const flags = {};
  const posicionales = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      posicionales.push(arg);
      continue;
    }

    const [clave, ...resto] = arg.slice(2).split('=');
    if (resto.length) {
      flags[clave] = resto.join('=');
      continue;
    }

    const siguiente = argv[i + 1];
    if (admiteValor.has(clave) && siguiente !== undefined && !siguiente.startsWith('--')) {
      flags[clave] = siguiente;
      i++;
    } else {
      flags[clave] = true;
    }
  }

  return { flags, posicionales };
}
