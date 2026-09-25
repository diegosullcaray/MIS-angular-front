import { normalizarPresentacionLegada } from './presentacion-legada.util';

describe('normalizarPresentacionLegada', () => {
  it('conserva el orden legacy como metadato sin mutar payload', () => {
    const columnas = [
      { columnDef: 'meta_car', header: 'Real', isdata: 1 },
      { columnDef: 'sem_car', isdata: 2, format: { type: 'traffic-light' } },
    ];
    const original = { headers: [{ columns: columnas }], body: [], additional: {} };
    const vista = normalizarPresentacionLegada(original);
    expect(vista.headers[0].columns.map(c => c.ordenPresentacion)).toEqual([1, 0]);
    expect(vista.headers[0].columns[0].style?.['color']).toBe('var(--mis-success)');
    expect(columnas[0]).not.toHaveProperty('ordenPresentacion');
    expect(columnas[0]).not.toHaveProperty('style');
  });

  it('respeta metadatos explícitos y colores del contrato', () => {
    const columna = { columnDef: 'real', isdata: 1, ordenPresentacion: 7, style: { color: 'var(--mis-danger)' } };
    const vista = normalizarPresentacionLegada({ headers: [{ columns: [columna] }], body: [], additional: {} });
    expect(vista.headers[0].columns[0]).toMatchObject(columna);
  });

  it('un encabezado con fondo del backend lleva texto blanco aunque diga "Real"', () => {
    const columna = { columnDef: 'real_mes', header: 'Real', isdata: 1, style: { background: '#1B7A3D' } };
    const vista = normalizarPresentacionLegada({ headers: [{ columns: [columna] }], body: [], additional: {} });
    expect(vista.headers[0].columns[0].style?.['color']).toBe('var(--mis-text-on-primary)');
  });
});
