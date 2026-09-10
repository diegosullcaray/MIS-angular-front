#!/usr/bin/env node
/**
 * Controla `src/assets`: qué se referencia y no existe, qué existe y nadie
 * referencia, y qué pesa de más.
 *
 * Una imagen que falta no rompe la compilación: el navegador pide la ruta, el
 * servidor devuelve 404 y la pantalla queda con el hueco. Una imagen que sobra
 * tampoco rompe nada — se copia al artefacto y engorda el despliegue en
 * silencio. Ninguna de las dos la ve una suite de pruebas.
 *
 *   node governance/scripts/verificar-activos.mjs                informe
 *   node governance/scripts/verificar-activos.mjs --check        falla si falta un activo referenciado
 *   node governance/scripts/verificar-activos.mjs --estricto     falla también con avisos
 *   node governance/scripts/verificar-activos.mjs --detalle       lista completa, no solo la cabeza
 *   node governance/scripts/verificar-activos.mjs --limite-kb=400
 *   node governance/scripts/verificar-activos.mjs --json
 */
import { statSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  SRC,
  listarArchivos,
  rutaRel,
  leer,
  existe,
  titulo,
  rojo,
  verde,
  amarillo,
  gris,
  negrita,
  opciones,
} from './lib/proyecto.mjs';

/** Por encima de esto una imagen decorativa conviene recortarla o reescalarla. */
const LIMITE_KB_POR_DEFECTO = 500;

/** Extensiones que se consideran activos servidos, no código. */
const EXTENSIONES_ACTIVO = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.ico', '.mp4', '.webm', '.woff', '.woff2', '.ttf', '.pdf', '.json', '.csv'];

/** Dónde se buscan referencias a `assets/…`. */
const FUENTES = ['.ts', '.html', '.css', '.scss'];

const { flags } = opciones();
const limiteKb = Number(flags['limite-kb'] ?? LIMITE_KB_POR_DEFECTO);

/**
 * Cuántas filas se listan por bloque. Sin tope, la compuerta de pre-commit
 * escupía 92 rutas de activos sin uso en cada corrida y tapaba el resto de la
 * cadena; el detalle completo sigue a un flag de distancia.
 */
const TOPE = flags['detalle'] ? Infinity : 5;

/** Imprime hasta `TOPE` filas y cuenta las que quedaron fuera. */
function listar(filas, formato) {
  for (const fila of filas.slice(0, TOPE)) console.log(gris(`  ${formato(fila)}`));
  const restantes = filas.length - Math.min(filas.length, TOPE);
  if (restantes > 0) console.log(gris(`  … y ${restantes} más (--detalle para verlas)`));
}

const activos = listarArchivos(resolve(SRC, 'assets'), EXTENSIONES_ACTIVO).map((absoluta) => ({
  ruta: rutaRel(absoluta),
  kb: Math.round(statSync(absoluta).size / 1024),
}));

/**
 * Referencias del código. Se acepta cualquier forma en que el repo escribe la
 * ruta: `/assets/…`, `assets/…`, `./assets/…`. Se recorta en el primer carácter
 * que no puede formar parte de una URL.
 */
const fuentes = [
  ...listarArchivos(resolve(SRC, 'app'), FUENTES),
  ...listarArchivos(SRC, ['.html']).filter((a) => rutaRel(a) === 'src/index.html'),
  ...(existe('src/styles.css') ? [resolve(SRC, 'styles.css')] : []),
  ...listarArchivos(resolve(SRC, 'assets'), ['.css']),
  // Los specs quedan fuera a propósito: sus rutas son fixtures inventados
  // (`ads/pieza-1.png` no existe ni tiene que existir), y contarlas daba tres
  // "activos faltantes" que en realidad eran datos de prueba.
].filter((archivo) => !archivo.endsWith('.spec.ts'));

const referencias = new Set();
for (const archivo of fuentes) {
  const contenido = leer(rutaRel(archivo));
  for (const m of contenido.matchAll(/(?:\.{0,2}\/)?assets\/[A-Za-z0-9_\-./]+/g)) {
    referencias.add('src/' + m[0].replace(/^\.{0,2}\//, ''));
  }
}

/**
 * Una ruta cuenta como referenciada si aparece tal cual, o si el código nombra
 * la carpeta que la contiene: hay activos que se arman concatenando
 * (`'/assets/images/fc/avatars/' + nombre`), y darlos por muertos sería
 * invitar a borrarlos.
 */
function referenciado(ruta) {
  if (referencias.has(ruta)) return true;
  for (const referencia of referencias) {
    if (referencia.endsWith('/') && ruta.startsWith(referencia)) return true;
    if (ruta.startsWith(referencia + '/')) return true;
    if (referencia.startsWith(ruta.slice(0, ruta.lastIndexOf('/') + 1)) && !referencia.includes('.')) return true;
  }
  return false;
}

const faltantes = [...referencias].filter((r) => EXTENSIONES_ACTIVO.some((e) => r.endsWith(e)) && !existe(r)).sort();
const huerfanos = activos.filter((a) => !referenciado(a.ruta)).sort((a, b) => b.kb - a.kb);
const pesados = activos.filter((a) => a.kb > limiteKb).sort((a, b) => b.kb - a.kb);
const pesoTotal = activos.reduce((total, a) => total + a.kb, 0);

if (flags['json']) {
  console.log(JSON.stringify({ total: activos.length, pesoTotalKb: pesoTotal, faltantes, huerfanos, pesados }, null, 2));
  process.exit(faltantes.length && flags['check'] ? 1 : 0);
}

titulo('Activos de src/assets', `${activos.length} archivo(s) · ${(pesoTotal / 1024).toFixed(1)} MB · límite por archivo ${limiteKb} kB`);

if (faltantes.length) {
  console.log(`${rojo('FALTA')} referenciado por el código y ausente en disco ${gris(`(${faltantes.length})`)}`);
  listar(faltantes, (f) => f);
  console.log('');
}

if (pesados.length) {
  console.log(`${amarillo('PESADO')} por encima de ${limiteKb} kB ${gris(`(${pesados.length})`)}`);
  listar(pesados, (p) => `${String(p.kb).padStart(5)} kB  ${p.ruta}`);
  console.log('');
}

if (huerfanos.length) {
  const pesoHuerfano = huerfanos.reduce((total, h) => total + h.kb, 0);
  console.log(
    `${amarillo('SIN USO')} nadie los referencia ${gris(`(${huerfanos.length} · ${(pesoHuerfano / 1024).toFixed(1)} MB)`)}`
  );
  listar(huerfanos, (h) => `${String(h.kb).padStart(5)} kB  ${h.ruta}`);
  console.log('');
}

const avisos = pesados.length + huerfanos.length;
console.log(
  faltantes.length
    ? `${rojo(`${faltantes.length} activo(s) faltante(s)`)} · ${amarillo(`${avisos} aviso(s)`)}`
    : `${verde('Ningún activo referenciado falta')} · ${amarillo(`${avisos} aviso(s)`)}`
);

if (flags['check'] && faltantes.length) process.exit(1);
if (flags['estricto'] && (faltantes.length || avisos)) process.exit(1);
