#!/usr/bin/env node
/**
 * Lanzador unificado de verificación — MIS Host (Financiera Confianza).
 *
 * Un único punto de entrada para desarrolladores, agentes de IA y CI, para que
 * "¿cómo se corre esto?" tenga siempre la misma respuesta.
 *
 * Uso:
 *   node governance/scripts/ejecutar-pruebas.mjs <comando> [opciones]
 *
 * Comandos:
 *   unit [ruta]     pruebas unitarias (Vitest vía @angular/build:unit-test)
 *   watch           unitarias en modo observador
 *   coverage        unitarias con reporte de cobertura
 *   e2e [ruta]      pruebas end-to-end (Playwright)
 *   e2e:ui          panel interactivo de Playwright
 *   e2e:report      abre el último informe HTML de Playwright
 *   gobernanza      auditoría de arquitectura (--check)
 *   documentacion   enlaces y referencias de governance/docs
 *   tokens          verifica que tokens.paleta.ts siga sincronizado con tokens.css
 *   inventario      verifica que los inventarios reflejen el código
 *   bundle          controla el artefacto de producción ya construido
 *   compilar        build de producción
 *   verificar       gobernanza + documentación + tokens + inventario (sin compilar, rápido)
 *   ci              cadena completa como la corre el pipeline
 *   all             alias de `ci`
 *   help            esta ayuda
 *
 * Cada fase informa su duración y la cadena se detiene en el primer fallo,
 * mostrando qué comando reproducirlo por separado.
 */

import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { titulo, verde, rojo, gris, negrita, opciones } from './lib/proyecto.mjs';

const esWindows = process.platform === 'win32';
const NPX = esWindows ? 'npx.cmd' : 'npx';
const NODE = process.execPath;

const { posicionales, flags } = opciones();
const comando = posicionales[0] ?? 'unit';
const extra = process.argv.slice(2).filter((a) => a !== comando);

const script = (nombre) => resolve(process.cwd(), 'governance/scripts', nombre);

function correr(cmd, args, etiqueta) {
  return new Promise((terminar) => {
    const inicio = Date.now();
    console.log(gris(`\n▶ ${etiqueta ?? `${cmd} ${args.join(' ')}`}`));

    // `shell` solo para los `.cmd` de npm (Node ya no los ejecuta directo en
    // Windows). Con el ejecutable de Node no se usa: su ruta lleva espacios
    // ("C:\Program Files\…") y el shell la partiría en dos.
    const hijo = spawn(cmd, args, {
      stdio: 'inherit',
      shell: esWindows && cmd.endsWith('.cmd'),
      cwd: process.cwd(),
    });

    hijo.on('close', (codigo) => {
      const seg = ((Date.now() - inicio) / 1000).toFixed(1);
      console.log(codigo === 0 ? gris(`  ✓ ${seg}s`) : rojo(`  ✗ falló en ${seg}s (código ${codigo})`));
      terminar(codigo === 0);
    });

    hijo.on('error', (err) => {
      console.error(rojo(`  ✗ no se pudo invocar '${cmd}': ${err.message}`));
      terminar(false);
    });
  });
}

/** Cadena de fases: se detiene en la primera que falla. */
async function cadena(nombre, fases) {
  titulo(nombre, `${fases.length} fases`);
  const inicio = Date.now();

  for (const [i, fase] of fases.entries()) {
    console.log(`\n${negrita(`Fase ${i + 1}/${fases.length}`)} — ${fase.nombre}`);
    const ok = await correr(fase.cmd, fase.args);
    if (!ok) {
      console.error(rojo(`\n✗ ${nombre} se detuvo en "${fase.nombre}".`));
      console.error(gris(`  Reproducilo con: ${fase.reproducir}\n`));
      process.exit(1);
    }
  }

  console.log(verde(`\n✓ ${nombre} completada en ${((Date.now() - inicio) / 1000).toFixed(1)}s.\n`));
  process.exit(0);
}

const FASES = {
  gobernanza: {
    nombre: 'Gobernanza de arquitectura',
    cmd: NODE,
    // Con línea base por defecto: el objetivo del pipeline es "cero hallazgos
    // NUEVOS", no arreglar de golpe la deuda que ya estaba. `--sin-linea-base`
    // muestra el total real cuando se quiere atacar el pasivo.
    args: [script('validar-gobernanza.mjs'), '--check', ...(flags['sin-linea-base'] ? [] : ['--linea-base'])],
    reproducir: 'npm run audit:governance',
  },
  documentacion: {
    nombre: 'Documentación de gobernanza',
    cmd: NODE,
    args: [script('validar-documentacion.mjs'), '--check'],
    reproducir: 'npm run audit:docs',
  },
  tokens: {
    nombre: 'Tokens de diseño sincronizados',
    cmd: NODE,
    args: [script('generar-tokens-paleta.mjs'), '--check'],
    reproducir: 'npm run tokens:check',
  },
  inventario: {
    nombre: 'Inventarios al día',
    cmd: NODE,
    args: [script('generar-inventario.mjs'), '--check'],
    reproducir: 'npm run inventario:check',
  },
  unit: {
    nombre: 'Pruebas unitarias',
    cmd: NPX,
    args: ['ng', 'test'],
    reproducir: 'npm test',
  },
  compilar: {
    nombre: 'Build de producción',
    cmd: NPX,
    args: ['ng', 'build', '--configuration', 'production'],
    reproducir: 'npx ng build --configuration production',
  },
  bundle: {
    nombre: 'Control del bundle',
    cmd: NODE,
    args: [script('verificar-bundle.mjs')],
    reproducir: 'npm run verify:bundle',
  },
  e2e: {
    nombre: 'Pruebas E2E',
    cmd: NPX,
    args: ['playwright', 'test'],
    reproducir: 'npm run e2e',
  },
};

async function main() {
  switch (comando) {
    case 'unit':
      process.exit((await correr(NPX, ['ng', 'test', ...extra], 'Pruebas unitarias (Vitest)')) ? 0 : 1);

    case 'watch':
      process.exit((await correr(NPX, ['ng', 'test', '--watch', ...extra], 'Vitest en modo observador')) ? 0 : 1);

    case 'coverage':
      process.exit((await correr(NPX, ['ng', 'test', '--coverage', ...extra], 'Cobertura de pruebas unitarias')) ? 0 : 1);

    case 'e2e':
      process.exit((await correr(NPX, ['playwright', 'test', ...extra], 'Playwright end-to-end')) ? 0 : 1);

    case 'e2e:ui':
      process.exit((await correr(NPX, ['playwright', 'test', '--ui', ...extra], 'Playwright UI')) ? 0 : 1);

    case 'e2e:report':
      process.exit((await correr(NPX, ['playwright', 'show-report', ...extra], 'Informe de Playwright')) ? 0 : 1);

    case 'gobernanza':
    case 'governance':
      process.exit((await correr(NODE, [script('validar-gobernanza.mjs'), ...extra], 'Auditoría de gobernanza')) ? 0 : 1);

    case 'documentacion':
    case 'docs':
      process.exit((await correr(NODE, [script('validar-documentacion.mjs'), ...extra], 'Validación de documentación')) ? 0 : 1);

    case 'tokens':
      process.exit((await correr(NODE, [script('generar-tokens-paleta.mjs'), ...extra], 'Tokens de diseño')) ? 0 : 1);

    case 'inventario':
      process.exit((await correr(NODE, [script('generar-inventario.mjs'), ...extra], 'Inventarios')) ? 0 : 1);

    case 'bundle':
      process.exit((await correr(NODE, [script('verificar-bundle.mjs'), ...extra], 'Control del bundle')) ? 0 : 1);

    case 'compilar':
      process.exit((await correr(NPX, ['ng', 'build', '--configuration', 'production', ...extra], 'Build de producción')) ? 0 : 1);

    /* Rápida: solo análisis estático, sin compilar ni levantar navegadores.
       Es la que conviene correr antes de cada commit. */
    case 'verificar':
      return cadena('Verificación estática', [FASES.gobernanza, FASES.documentacion, FASES.tokens, FASES.inventario]);

    /* Completa: lo mismo que ejecuta el pipeline. El E2E queda fuera por
       defecto porque levanta `ng serve` y tarda; se suma con --con-e2e. */
    case 'ci':
    case 'all':
      return cadena('Verificación completa', [
        FASES.gobernanza,
        FASES.documentacion,
        FASES.tokens,
        FASES.inventario,
        FASES.unit,
        FASES.compilar,
        FASES.bundle,
        ...(flags['con-e2e'] ? [FASES.e2e] : []),
      ]);

    case 'help':
    case '--help':
    case '-h':
    default: {
      const desconocido = !['help', '--help', '-h'].includes(comando);
      if (desconocido) console.error(rojo(`Comando desconocido: ${comando}\n`));
      console.log(`
${negrita('Lanzador de verificación — MIS Host')}

  node governance/scripts/ejecutar-pruebas.mjs <comando> [opciones]

${negrita('Pruebas')}
  unit [ruta]     pruebas unitarias (Vitest)
  watch           unitarias en modo observador
  coverage        unitarias con cobertura
  e2e [ruta]      end-to-end (Playwright)
  e2e:ui          panel interactivo de Playwright
  e2e:report      abre el último informe HTML

${negrita('Gobernanza')}
  gobernanza      auditoría de arquitectura y seguridad
  documentacion   enlaces y referencias de governance/docs
  tokens          tokens.paleta.ts sincronizado con tokens.css
  inventario      inventarios de módulos y pruebas al día

${negrita('Artefacto')}
  compilar        build de producción
  bundle          control del artefacto ya construido

${negrita('Cadenas')}
  verificar       análisis estático completo, sin compilar (pre-commit)
  ci | all        cadena del pipeline; sumá --con-e2e para incluir Playwright

${negrita('Ejemplos')}
  node governance/scripts/ejecutar-pruebas.mjs verificar
  node governance/scripts/ejecutar-pruebas.mjs unit src/app/pages/modules/analista
  node governance/scripts/ejecutar-pruebas.mjs ci --con-e2e
`);
      process.exit(desconocido ? 1 : 0);
    }
  }
}

main().catch((err) => {
  console.error(rojo('Error no controlado en el lanzador:'), err);
  process.exit(1);
});
