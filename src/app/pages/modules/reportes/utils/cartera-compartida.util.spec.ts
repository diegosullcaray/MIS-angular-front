import {
  columnasVisibles,
  conColumnasSemaforo,
  detalleAgricolaDe,
  metaAgricolaDe,
  totalesAgro,
} from './cartera-compartida.util';

describe('mapeos compartidos de Cartera', () => {
  it('acepta meta1 agrícola serializado o ya parseado', () => {
    const meta = [{ saldo: 12 }];
    expect(metaAgricolaDe({ meta1: JSON.stringify(meta) })).toEqual(meta);
    expect(metaAgricolaDe({ meta1: meta })).toEqual(meta);
    expect(metaAgricolaDe(undefined)).toBeUndefined();
  });

  it('oculta columnas del backend y enlaza el semáforo de CMG', () => {
    const visibles = columnasVisibles(
      JSON.stringify([
        { key: '9', label: 'Avance' },
        { key: '8', label: 'Control', cellStyle: { display: 'none' } },
      ]),
    );
    expect(conColumnasSemaforo(visibles)).toEqual([
      { key: '9', label: 'Avance', semaforoKey: '8' },
    ]);
  });

  it('conserva cero cuando faltan los valores de los totales agrícolas', () => {
    expect(totalesAgro({}, {}).every((total) => total.actual === 0 && total.anterior === 0)).toBe(
      true,
    );
  });

  it('asocia las filas de clientes con su gráfico agrícola', () => {
    const resultado = detalleAgricolaDe([
      {
        body: {
          resultado: {
            headers: JSON.stringify({ categories: ['Arroz'], series: [] }),
            data: [{ HDESCLI: 'Ana' }],
          },
        },
      },
    ]);
    expect(resultado.filasPorGrafico['saldoCartera']).toEqual([{ HDESCLI: 'Ana' }]);
  });
});
