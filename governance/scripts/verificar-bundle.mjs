/**
 * Falla si alguna configuración de desarrollo llegó al bundle de producción.
 * Corre tras `ng build --configuration production` (ver `npm run build:prod`).
 * En Node y no en `grep` para que funcione igual en Windows y en CI.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIRECTORIO = 'dist/mis-host/browser';

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
];

function archivosJs(directorio) {
  return readdirSync(directorio).flatMap((entrada) => {
    const ruta = join(directorio, entrada);
    if (statSync(ruta).isDirectory()) return archivosJs(ruta);
    return ruta.endsWith('.js') ? [ruta] : [];
  });
}

let archivos;
try {
  archivos = archivosJs(DIRECTORIO);
} catch {
  console.error(`No se encontró ${DIRECTORIO}. Ejecuta antes: ng build --configuration production`);
  process.exit(1);
}

const hallazgos = [];
for (const archivo of archivos) {
  const contenido = readFileSync(archivo, 'utf8');
  for (const { patron, motivo } of PROHIBIDO) {
    const coincidencias = contenido.match(patron);
    if (coincidencias) {
      hallazgos.push({ archivo, motivo, ejemplos: [...new Set(coincidencias)].slice(0, 3) });
    }
  }
}

if (hallazgos.length > 0) {
  console.error('\n✗ El bundle de producción contiene configuración de desarrollo:\n');
  for (const { archivo, motivo, ejemplos } of hallazgos) {
    console.error(`  ${motivo}`);
    console.error(`    ${archivo}`);
    console.error(`    → ${ejemplos.join(', ')}\n`);
  }
  console.error('Revisa `fileReplacements` en angular.json y src/environments/.\n');
  process.exit(1);
}

console.log(`✓ Bundle limpio — ${archivos.length} archivos JS revisados, sin configuración de desarrollo.`);
