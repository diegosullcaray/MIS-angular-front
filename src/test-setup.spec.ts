/**
 * El entorno de pruebas tiene que ofrecer almacenamiento web.
 *
 * Sin esto, la ausencia de `localStorage` no se ve como un problema de entorno
 * sino como 92 pruebas rotas repartidas en 12 archivos, todas con el mismo
 * `Cannot read properties of undefined (reading 'clear')`. Acá falla una sola,
 * y dice exactamente qué falta.
 *
 * Ver `src/test-setup.ts` para por qué jsdom puede no darlo.
 */
describe('Entorno de pruebas — almacenamiento del navegador', () => {
  it.each(['localStorage', 'sessionStorage'] as const)('%s existe', (nombre) => {
    expect((globalThis as Record<string, unknown>)[nombre]).toBeDefined();
  });

  it.each([
    ['localStorage', () => localStorage],
    ['sessionStorage', () => sessionStorage],
  ] as const)('%s guarda, devuelve y borra', (_nombre, almacen) => {
    almacen().setItem('mis.prueba', 'valor');
    expect(almacen().getItem('mis.prueba')).toBe('valor');

    almacen().removeItem('mis.prueba');
    expect(almacen().getItem('mis.prueba')).toBeNull();

    almacen().setItem('mis.prueba', 'otro');
    almacen().clear();
    expect(almacen().getItem('mis.prueba')).toBeNull();
  });

  // Lo que `test-setup.ts` promete a los demás specs: arrancar sin residuos.
  it('sessionStorage llega vacío a cada test', () => {
    expect(sessionStorage.length).toBe(0);
  });
});
