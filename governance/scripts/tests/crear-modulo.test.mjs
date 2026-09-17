import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { stripTypeScriptTypes } from 'node:module';

const script = resolve('governance/scripts/crear-modulo.mjs');

async function ejecutar(args, comprobar) {
  const temporal = mkdtempSync(join(tmpdir(), 'mis-scaffold-'));
  try {
    const resultado = spawnSync(process.execPath, [script, 'prueba', ...args], {
      cwd: temporal, encoding: 'utf8',
    });
    return await comprobar(resultado, temporal);
  } finally {
    rmSync(temporal, { recursive: true, force: true });
  }
}

test('no inventa códigos ni endpoints', async () => {
  await ejecutar([], r => assert.equal(r.status, 1));
  await ejecutar(['--transporte=http'], r => assert.equal(r.status, 1));
});

test('genera conversiones exactas y rechaza payloads inválidos', async () => {
  await ejecutar(['--cod-rep', 'RS_PRUEBA'], async (r, dir) => {
    assert.equal(r.status, 0, r.stderr);
    const ruta = join(dir, 'src/app/pages/modules/prueba/utils/prueba.util.ts');
    const js = stripTypeScriptTypes(readFileSync(ruta, 'utf8'));
    const modulo = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
    const fila = { cod: '1', des: 'Prueba', est: 'ACTIVO' };
    for (const [mto, esperado] of [['2 300,00', 2300], ['S/ 1,250.75', 1250.75], ['1.250,75', 1250.75], ['-2 300,00', -2300], [0, 0]]) {
      assert.equal(modulo.mapPruebaFila({ ...fila, mto }).monto, esperado);
    }
    assert.deepEqual(modulo.mapPruebaFilas([]), []);
    assert.throws(() => modulo.mapPruebaFilas({}));
    assert.throws(() => modulo.mapPruebaFila({ ...fila, mto: 'texto' }));
    const servicio = readFileSync(join(dir, 'src/app/pages/modules/prueba/services/prueba.service.ts'), 'utf8');
    assert.match(servicio, /consulta\?\.unsubscribe\(\)/);
    assert.match(servicio, /onDestroy/);
    assert.match(servicio, /\.pipe\(/);
  });
});

test('HTTP usa el endpoint explícito y el scaffold no registra ruta en dry-run', async () => {
  await ejecutar(['--transporte=http', '--endpoint', '/host/consulta'], (r, dir) => {
    assert.equal(r.status, 0, r.stderr);
    const servicio = readFileSync(join(dir, 'src/app/pages/modules/prueba/services/prueba.service.ts'), 'utf8');
    assert.match(servicio, /"\/host\/consulta"/);
    assert.doesNotMatch(servicio, /\/api\/prueba/);
    const spec = readFileSync(join(dir, 'src/app/pages/modules/prueba/services/prueba.service.spec.ts'), 'utf8');
    assert.match(spec, /HttpClient/);
    assert.match(spec, /\/host\/consulta/);
  });
  await ejecutar(['--cod-rep', 'RS_PRUEBA', '--dry-run'], r => assert.equal(r.status, 0));
});
