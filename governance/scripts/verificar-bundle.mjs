#!/usr/bin/env node
/**
 * Control del bundle de producción — MIS Host.
 *
 * Corre tras `ng build --configuration production` (ver `npm run build:prod`).
 * En Node y no en `grep` para que funcione igual en Windows y en CI.
 *
 * Verifica dos cosas distintas:
 *
 *   Bloqueante  configuración de desarrollo que se coló al artefacto público:
 *               identidades de prueba, hosts locales, source maps.
 *   Informativo  el peso del bundle inicial contra el presupuesto declarado en
 *               `angular.json`, para que una regresión de tamaño se vea en el
 *               log del build y no seis semanas después.
 *
 * Lo que este script NO puede hacer: proteger los secretos Winder. Están
 * compilados en `src/environments/` y cualquiera los lee del JavaScript
 * descargado — ver `governance/docs/security/findings.md`. Acá solo se
 * comprueba que no se sume una filtración *nueva*.
 *
 * Uso:
 *   node governance/scripts/verificar-bundle.mjs
 *   node governance/scripts/verificar-bundle.mjs --dir=dist/mis-host/browser
 *   node governance/scripts/verificar-bundle.mjs --json
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { opciones, titulo, verde, rojo, amarillo, gris } from './lib/proyecto.mjs';

const { flags } = opciones();
const DIRECTORIO = typeof flags['dir'] === 'string' ? flags['dir'] : 'dist/mis-host/browser';

const PROHIBIDO = [
  {
    // Exige la arroba: `sites.google.com/confianza.pe/...` de externalLinks es legítimo.
    patron: /[a-z]+\.[a-z]+@confianza\.pe/gi,
    motivo: 'identidad de prueba (devUser)',
  },
  {
    patron: /localhost:\d{2,5}/gi,
    motivo: 'URL de desarrollo (localhost)',
  },
  {
    patron: /\/\/# sourceMappingURL=/g,
    motivo: 'source map enlazado (expone el código original)',
  },
  {
    // Un JWT o token pegado a mano en el código sobrevive a la minificación.
    patron: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\./g,
    motivo: 'token con forma de JWT embebido',
  },
];

function archivos(directorio, extensiones) {
  return readdirSync(directorio).flatMap((entrada) => {
    const ruta = join(directorio, entrada);
    if (statSync(ruta).isDirectory()) return archivos(ruta, extensiones);
    return extensiones.some((e) => ruta.endsWith(e)) ? [ruta] : [];
  });
}

let js;
let mapas;
try {
  js = archivos(DIRECTORIO, ['.js']);
  mapas = archivos(DIRECTORIO, ['.js.map']);
} catch {
  console.error(rojo(`No se encontró ${DIRECTORIO}. Ejecutá antes: ng build --configuration production`));
  process.exit(1);
}

/* ── 1. Contenido prohibido ───────────────────────────────── */

const hallazgos = [];
for (const archivo of js) {
  const contenido = readFileSync(archivo, 'utf8');
  for (const { patron, motivo } of PROHIBIDO) {
    const coincidencias = contenido.match(patron);
    if (coincidencias) {
      hallazgos.push({ archivo, motivo, ejemplos: [...new Set(coincidencias)].slice(0, 3) });
    }
  }
}
if (mapas.length > 0) {
  hallazgos.push({
    archivo: DIRECTORIO,
    motivo: 'archivos .js.map publicados',
    ejemplos: mapas.slice(0, 3),
  });
}

/* ── 2. Peso contra el presupuesto de angular.json ────────── */

function aBytes(texto) {
  const m = String(texto).trim().match(/^([\d.]+)\s*(b|kb|mb)$/i);
  if (!m) return null;
  const unidad = { b: 1, kb: 1024, mb: 1024 * 1024 }[m[2].toLowerCase()];
  return Number(m[1]) * unidad;
}

function presupuestoInicial() {
  try {
    const cfg = JSON.parse(readFileSync('angular.json', 'utf8'));
    const budgets = cfg.projects?.['mis-host']?.architect?.build?.configurations?.production?.budgets ?? [];
    return budgets.find((b) => b.type === 'initial') ?? null;
  } catch {
    return null;
  }
}

// El bundle inicial son los `.js` sin hash de lazy chunk: main, polyfills y
// runtime. Los chunks diferidos no cuentan contra el presupuesto inicial.
const iniciales = js.filter((f) => /(main|polyfills|runtime|styles)[.-]/.test(f));
const pesoInicial = iniciales.reduce((total, f) => total + statSync(f).size, 0);
const pesoTotal = js.reduce((total, f) => total + statSync(f).size, 0);
const presupuesto = presupuestoInicial();
const limiteError = presupuesto ? aBytes(presupuesto.maximumError) : null;
const limiteAviso = presupuesto ? aBytes(presupuesto.maximumWarning) : null;

const mb = (n) => `${(n / 1024 / 1024).toFixed(2)} MB`;

if (flags['json']) {
  console.log(
    JSON.stringify(
      {
        directorio: DIRECTORIO,
        archivosJs: js.length,
        pesoInicialBytes: pesoInicial,
        pesoTotalBytes: pesoTotal,
        presupuesto,
        hallazgos,
      },
      null,
      2
    )
  );
  process.exit(hallazgos.length > 0 ? 1 : 0);
}

titulo('Control del bundle de producción', `${DIRECTORIO} · ${js.length} archivos JS`);

console.log(`Peso inicial (main/polyfills/runtime): ${mb(pesoInicial)}`);
console.log(`Peso total de JavaScript:             ${mb(pesoTotal)}`);
if (presupuesto) {
  const estado =
    limiteError && pesoInicial > limiteError
      ? rojo(`por encima del error (${presupuesto.maximumError})`)
      : limiteAviso && pesoInicial > limiteAviso
        ? amarillo(`por encima del aviso (${presupuesto.maximumWarning})`)
        : verde(`dentro del presupuesto (${presupuesto.maximumWarning} / ${presupuesto.maximumError})`);
  console.log(`Presupuesto inicial:                  ${estado}`);
  console.log(gris('El corte real lo aplica el builder de Angular; acá solo queda registrado en el log.'));
}

if (hallazgos.length > 0) {
  console.error(rojo('\n✗ El bundle de producción contiene configuración de desarrollo:\n'));
  for (const { archivo, motivo, ejemplos } of hallazgos) {
    console.error(`  ${motivo}`);
    console.error(gris(`    ${archivo}`));
    console.error(gris(`    → ${ejemplos.join(', ')}\n`));
  }
  console.error('Revisá `fileReplacements` en angular.json y src/environments/.\n');
  process.exit(1);
}

console.log(verde(`\n✓ Bundle limpio — sin configuración de desarrollo, source maps ni tokens embebidos.\n`));
