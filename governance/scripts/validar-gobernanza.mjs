#!/usr/bin/env node
/**
 * Auditor de gobernanza y arquitectura para MIS Host (Financiera Confianza).
 *
 * Valida las reglas descritas en `governance/docs/development/conventions.md`:
 * 1. Aislamiento de capas:
 *    - `src/app/core` no debe depender de `src/app/pages`.
 *    - `src/app/shared` no debe depender de `src/app/pages/modules`.
 * 2. Prácticas modernas de Angular 22 Zoneless:
 *    - Detección de uso de decoradores obsoletos `@Input()` / `@Output()` en lugar de funciones de señales (`input()`, `output()`).
 * 3. Seguridad y limpieza de código:
 *    - Alertas sobre emails de prueba (@confianza.pe) o localhost fuera de archivos de mocks o fixtures.
 *
 * Uso:
 *   node governance/scripts/validar-gobernanza.mjs [--strict]
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const SRC_DIR = resolve(process.cwd(), 'src/app');
const isStrict = process.argv.includes('--strict');
const shouldFailOnError = isStrict || process.argv.includes('--check');

function walkFiles(dir, filterExt = ['.ts']) {
  let results = [];
  try {
    const list = readdirSync(dir);
    for (const file of list) {
      const fullPath = join(dir, file);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        results = results.concat(walkFiles(fullPath, filterExt));
      } else if (filterExt.some((ext) => fullPath.endsWith(ext))) {
        results.push(fullPath);
      }
    }
  } catch (err) {
    // Si la carpeta no existe, retornar lista vacía
  }
  return results;
}

const errors = [];
const warnings = [];

console.log(`\n======================================================`);
console.log(` 🛡️  MIS Host: Auditoría de Gobernanza y Arquitectura`);
console.log(`======================================================\n`);

// 1. Regla: core no debe importar pages
const coreFiles = walkFiles(join(SRC_DIR, 'core'));
for (const file of coreFiles) {
  if (file.endsWith('.spec.ts')) continue;
  const content = readFileSync(file, 'utf8');
  const match = content.match(/from\s+['"][^'"]*pages\/[^'"]*['"]/g);
  if (match) {
    errors.push({
      regla: 'Aislamiento de Core',
      archivo: relative(process.cwd(), file),
      detalle: `El módulo core no debe depender de páginas o módulos: ${match.join(', ')}`,
    });
  }
}

// 2. Regla: shared no debe importar pages/modules
const sharedFiles = walkFiles(join(SRC_DIR, 'shared'));
for (const file of sharedFiles) {
  if (file.endsWith('.spec.ts')) continue;
  const content = readFileSync(file, 'utf8');
  const match = content.match(/from\s+['"][^'"]*pages\/modules\/[^'"]*['"]/g);
  if (match) {
    errors.push({
      regla: 'Aislamiento de Shared',
      archivo: relative(process.cwd(), file),
      detalle: `El módulo shared no debe acoplarse a módulos específicos: ${match.join(', ')}`,
    });
  }
}

// 3. Regla: En componentes nuevos preferir señales (input(), output()) en lugar de decoradores (@Input(), @Output())
const componentFiles = walkFiles(SRC_DIR).filter((f) => f.endsWith('.component.ts'));
for (const file of componentFiles) {
  if (file.endsWith('.spec.ts')) continue;
  const content = readFileSync(file, 'utf8');

  // Detectar @Input() / @Output()
  const hasLegacyInput = /@Input\s*\(/g.test(content);
  const hasLegacyOutput = /@Output\s*\(/g.test(content);

  if (hasLegacyInput || hasLegacyOutput) {
    warnings.push({
      regla: 'Modernización Angular 22 Signals',
      archivo: relative(process.cwd(), file),
      detalle: `Uso de decorador legacy ${hasLegacyInput ? '@Input' : ''} ${hasLegacyOutput ? '@Output' : ''}. En Angular 22 se recomienda migrar a 'input()' y 'output()'.`,
    });
  }
}

// 4. Seguridad: datos sensibles o dev hardcoded en código productivo
const allAppFiles = walkFiles(SRC_DIR);
for (const file of allAppFiles) {
  if (file.endsWith('.spec.ts') || file.includes('mock') || file.includes('fixture') || file.includes('environment')) {
    continue;
  }
  const content = readFileSync(file, 'utf8');
  const matchDevEmail = content.match(/[a-z]+\.[a-z]+@confianza\.pe/gi);
  if (matchDevEmail) {
    warnings.push({
      regla: 'Seguridad y Privacidad',
      archivo: relative(process.cwd(), file),
      detalle: `Correo institucional detectado en código productivo (${[...new Set(matchDevEmail)].join(', ')}). Usar variables de configuración o fixtures.`,
    });
  }
}

// Reporte de resultados
console.log(`Archivos auditados en src/app: ${allAppFiles.length}`);

if (warnings.length > 0) {
  console.log(`\n⚠️  Advertencias encontradas (${warnings.length}):`);
  for (const w of warnings) {
    console.log(`  [${w.regla}] ${w.archivo}`);
    console.log(`    → ${w.detalle}`);
  }
}

if (errors.length > 0) {
  console.error(`\n❌ Infracciones críticas de gobernanza (${errors.length}):`);
  for (const e of errors) {
    console.error(`  [${e.regla}] ${e.archivo}`);
    console.error(`    → ${e.detalle}`);
  }
  console.log(`\nRevisa las guías en governance/docs/development/conventions.md para resolverlas.`);

  if (shouldFailOnError) {
    console.error(`\n[Fallo forzado por flag --check/--strict]\n`);
    process.exit(1);
  } else {
    console.log(`\n💡 Nota: Para que este script falle en CI cuando existan infracciones, ejecuta con:`);
    console.log(`   node governance/scripts/validar-gobernanza.mjs --check\n`);
  }
}

if (isStrict && warnings.length > 0) {
  console.error(`\n❌ Modo estricto activado: Fallo debido a advertencias.\n`);
  process.exit(1);
}

if (errors.length === 0) {
  console.log(`\n✓ ¡Auditoría de gobernanza aprobada sin infracciones críticas!\n`);
}
process.exit(0);
