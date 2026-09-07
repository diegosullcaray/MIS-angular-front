#!/usr/bin/env node
/**
 * Lanzador unificado de pruebas para MIS Host (Financiera Confianza).
 *
 * Facilita la ejecución de suites de pruebas unitarias (Vitest), pruebas E2E (Playwright)
 * y validaciones de gobernanza/arquitectura, tanto en local como en pipelines de CI.
 *
 * Uso:
 *   node governance/scripts/ejecutar-pruebas.mjs [comando] [opciones]
 *
 * Comandos:
 *   unit [archivo]     Ejecuta pruebas unitarias (ng test / Vitest)
 *   e2e                Ejecuta pruebas E2E (Playwright)
 *   e2e:ui             Abre la interfaz visual de Playwright
 *   watch              Ejecuta pruebas unitarias en modo interactivo/watch
 *   coverage           Genera reporte de cobertura de pruebas unitarias
 *   governance         Ejecuta validaciones de arquitectura y reglas
 *   all                Ejecuta gobernanza, pruebas unitarias y verificación de bundle
 *
 * Ejemplos:
 *   node governance/scripts/ejecutar-pruebas.mjs unit
 *   node governance/scripts/ejecutar-pruebas.mjs unit src/app/pages/modules/analista
 *   node governance/scripts/ejecutar-pruebas.mjs e2e
 *   node governance/scripts/ejecutar-pruebas.mjs all
 */

import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const isWindows = process.platform === 'win32';
const npxCmd = isWindows ? 'npx.cmd' : 'npx';
const nodeCmd = 'node';

const args = process.argv.slice(2);
const command = args[0] || 'unit';
const extraArgs = args.slice(1);

function printBanner(title, desc) {
  console.log(`\n======================================================`);
  console.log(` 🧪 MIS Host Test Runner: ${title}`);
  if (desc) console.log(`    ${desc}`);
  console.log(`======================================================\n`);
}

function runProcess(cmd, procArgs, options = {}) {
  return new Promise((resolveResult) => {
    const startTime = Date.now();
    console.log(`▶ Ejecutando: ${cmd} ${procArgs.join(' ')}\n`);

    const child = spawn(cmd, procArgs, {
      stdio: 'inherit',
      shell: isWindows,
      cwd: process.cwd(),
      ...options,
    });

    child.on('close', (code) => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      if (code === 0) {
        console.log(`\n✓ Completado exitosamente en ${elapsed}s (código 0).\n`);
      } else {
        console.error(`\n✗ Falló tras ${elapsed}s (código de salida: ${code}).\n`);
      }
      resolveResult(code === 0);
    });

    child.on('error', (err) => {
      console.error(`\n✗ Error al invocar el comando '${cmd}':`, err.message);
      resolveResult(false);
    });
  });
}

async function main() {
  switch (command) {
    case 'unit': {
      printBanner('Pruebas Unitarias', 'Vitest vía @angular/build:unit-test');
      const testArgs = ['ng', 'test', ...extraArgs];
      const success = await runProcess(npxCmd, testArgs);
      process.exit(success ? 0 : 1);
      break;
    }

    case 'watch': {
      printBanner('Pruebas Unitarias en Modo Watch', 'Vitest interactivo');
      const testArgs = ['ng', 'test', '--watch', ...extraArgs];
      const success = await runProcess(npxCmd, testArgs);
      process.exit(success ? 0 : 1);
      break;
    }

    case 'coverage': {
      printBanner('Cobertura de Pruebas Unitarias', 'Generación de reporte lcov/html');
      const testArgs = ['ng', 'test', '--coverage', ...extraArgs];
      const success = await runProcess(npxCmd, testArgs);
      process.exit(success ? 0 : 1);
      break;
    }

    case 'e2e': {
      printBanner('Pruebas E2E', 'Playwright End-to-End Test Suite');
      const testArgs = ['playwright', 'test', ...extraArgs];
      const success = await runProcess(npxCmd, testArgs);
      process.exit(success ? 0 : 1);
      break;
    }

    case 'e2e:ui': {
      printBanner('Playwright UI', 'Lanzando interfaz interactiva');
      const testArgs = ['playwright', 'test', '--ui', ...extraArgs];
      const success = await runProcess(npxCmd, testArgs);
      process.exit(success ? 0 : 1);
      break;
    }

    case 'governance': {
      printBanner('Validación de Gobernanza', 'Auditoría de reglas y arquitectura');
      const govScript = resolve(process.cwd(), 'governance/scripts/validar-gobernanza.mjs');
      const success = await runProcess(nodeCmd, [govScript, ...extraArgs]);
      process.exit(success ? 0 : 1);
      break;
    }

    case 'all': {
      printBanner('Suite Completa de Verificación', 'Gobernanza + Pruebas Unitarias');
      console.log('Fase 1/2: Auditoría de gobernanza arquitectónica...');
      const govScript = resolve(process.cwd(), 'governance/scripts/validar-gobernanza.mjs');
      const govOk = await runProcess(nodeCmd, [govScript]);

      if (!govOk) {
        console.error('✗ Fase 1 falló: Corrige las advertencias de gobernanza antes de continuar.');
        process.exit(1);
      }

      console.log('\nFase 2/2: Pruebas unitarias de frontend...');
      const unitOk = await runProcess(npxCmd, ['ng', 'test']);

      if (!unitOk) {
        console.error('✗ Fase 2 falló: Hay pruebas unitarias fallidas.');
        process.exit(1);
      }

      console.log('\n✓ ¡Todas las validaciones y pruebas concluyeron con éxito!');
      process.exit(0);
      break;
    }

    case 'help':
    case '--help':
    case '-h':
    default: {
      console.log(`
Lanzador de Pruebas — MIS Host (Financiera Confianza)

Uso:
  node governance/scripts/ejecutar-pruebas.mjs <comando> [opciones]

Comandos soportados:
  unit [archivo]     Ejecuta pruebas unitarias (Vitest)
  watch              Ejecuta pruebas unitarias en modo observador (watch)
  coverage           Calcula el porcentaje de cobertura de código
  e2e                Ejecuta las pruebas de extremo a extremo (Playwright)
  e2e:ui             Abre el panel interactivo de Playwright
  governance         Ejecuta la auditoría de gobernanza y arquitectura
  all                Corre la validación de gobernanza seguida de pruebas unitarias
  help               Muestra este mensaje

Ejemplos:
  node governance/scripts/ejecutar-pruebas.mjs unit
  node governance/scripts/ejecutar-pruebas.mjs coverage
  node governance/scripts/ejecutar-pruebas.mjs e2e
  node governance/scripts/ejecutar-pruebas.mjs all
`);
      process.exit(command === 'help' || command === '--help' ? 0 : 1);
    }
  }
}

main().catch((err) => {
  console.error('Error no controlado en el ejecutor de pruebas:', err);
  process.exit(1);
});
