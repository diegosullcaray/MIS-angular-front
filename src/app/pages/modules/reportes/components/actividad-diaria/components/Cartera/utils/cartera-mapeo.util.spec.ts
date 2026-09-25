import { columnasVisibles, conColumnasSemaforo, conSemaforos, graficoGestionComercial, tarjetasCmgCartera, totalesAgro } from './cartera-mapeo.util';

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

  it('arma las tarjetas de CMG Cartera con los textos del legado', () => {
    const filas: Record<string, unknown>[] = Array.from({ length: 19 }, () => ({}));
    filas[16] = { 6: '35.26 %' };
    filas[18] = { 5: 2491448, 6: 2507495 };
    const kpis = { des_acum: 242813000, meta_des_acum: 268169000, cumpl_des_acum: 90.5, ope_acum_: 28370, meta_ope_acum_: 33866, cumpl_ope_acum: 83.8, tasaminima: '40.38%' };

    const [monto, ope, tapp, saldo] = tarjetasCmgCartera(filas, kpis);
    expect(monto).toMatchObject({ valor: 242813, comparativo: 'Meta 268,169', cumplimiento: 90.5 });
    // Operaciones: el legado muestra solo la meta, sin "Meta".
    expect(ope).toMatchObject({ valor: 28370, comparativo: '33,866', cumplimiento: 83.8 });
    expect(tapp).toMatchObject({ valor: '35.26 %', comparativo: '40.38%', senal: -1, delta: '-512 pbs' });
    expect(saldo).toMatchObject({ valor: 2507495, comparativo: 'Mes Anterior 2,491,448', senal: 1, delta: '16,047' });
  });
});
