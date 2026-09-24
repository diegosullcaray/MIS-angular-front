import { columnasVisibles, conColumnasSemaforo, conSemaforos, graficoGestionComercial, totalesAgro } from './cartera-mapeo.util';

describe('mapeos de Cartera', () => {
  it('oculta las columnas que el contrato marca como no visibles y agrega semáforos CMG', () => {
    const visibles = columnasVisibles(JSON.stringify([
      { key: 'a', label: 'A' }, { key: 'b', label: 'B', cellStyle: { display: 'none' } },
    ]));

    expect(visibles.map((columna) => columna.key)).toEqual(['a']);
    expect(conColumnasSemaforo([{ key: 'AVANCE', label: 'Avance' }])[0]).toMatchObject({ key: 'AVANCE' });
  });

  it('calcula semáforos por avance frente al timing', () => {
    expect(conSemaforos({ Timing: 50, AVANCE_DES: 0.5 })).toMatchObject({ Timing: 50, AVANCE_DES: 0.5 });
  });

  it('calcula totales agrícolas sin romper ante valores ausentes', () => {
    const totales = totalesAgro({}, {});
    expect(totales).not.toHaveLength(0);
    expect(totales.every((total) => total.actual === 0 && total.anterior === 0)).toBe(true);
  });

  it('prioriza data para el gráfico de gestión comercial y convierte porcentajes', () => {
    const grafico = graficoGestionComercial(
      { data: [{ payload: JSON.stringify({ categories: ['Ene'], series: [{ name: 'Tasa', data: [0.2] }] }) }] },
      { codRep: 'TEST', titulo: 'Tasa', formato: 'numero', apilado: false, esPorcentaje: () => true },
    );

    expect(grafico).toMatchObject({ titulo: 'Tasa', categorias: ['Ene'], series: [{ nombre: 'Tasa %', datos: [20] }] });
  });
});
