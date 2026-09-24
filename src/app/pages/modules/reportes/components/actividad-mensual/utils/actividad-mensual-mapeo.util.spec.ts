import { tarjetasCmgCarteraMensual } from './actividad-mensual-mapeo.util';

describe('tarjetasCmgCarteraMensual', () => {
  it('normaliza KPIs, conserva porcentajes y calcula deltas con signo', () => {
    const filas = Array.from({ length: 19 }, () => ({} as Record<string, unknown>));
    filas[18] = { 5: '900', 6: '1,200' };
    filas[16] = { 6: '42.07%' };

    const tarjetas = tarjetasCmgCarteraMensual(filas, {
      des_acum: '2000000', meta_des_acum: '3000000', ope_acum_: '9', meta_ope_acum_: '10', tasaminima: '41.50%',
    });

    expect(tarjetas[0].valor).toBe(2000);
    expect(tarjetas[2]).toMatchObject({ valor: '42.07%', comparativo: 'Mínima 41.50%', senal: 1, delta: '+57 pbs' });
    expect(tarjetas[3]).toMatchObject({ valor: 1200, senal: 1, delta: '+300' });
  });

  it('representa los porcentajes ausentes como guion', () => {
    const tarjetas = tarjetasCmgCarteraMensual([], {});
    expect(tarjetas[2].valor).toBe('—');
  });
});
