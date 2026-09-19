import { mapearResultadosIncentivos } from './incentivos-resultados.util';
import { resolverConfiguracionUsuario } from './incentivos-config.util';

describe('mapearResultadosIncentivos', () => {
  const nivel = { tipCod: 1, codRel: '001', claUsu: 1 as const };
  const cfg = resolverConfiguracionUsuario(nivel.tipCod, nivel.claUsu);

  it('convierte texto numérico sin mutar resultados ni configuración', () => {
    const ds = Object.freeze({ ds3: Object.freeze({ car_avan_fix: '0.8' }), ds4: Object.freeze({ bob_car: '100', bop_car: '20', bos_prod: '30', flag_car: '1' }) });
    const vista = mapearResultadosIncentivos(ds, cfg, nivel, true);
    expect(vista.avances.find(a => a.id === 'car')?.val).toBe(0.8);
    expect(vista.semaforo.find(a => a.id === 'car')?.val).toBe(1);
    expect(vista.monetizado.bonoTotal).toBe(150);
    expect(ds.ds3.car_avan_fix).toBe('0.8');
  });

  it('vacío reinicia valores y un dato numérico ilegible no parece válido', () => {
    expect(mapearResultadosIncentivos({}, cfg, nivel, true).monetizado.bonoTotal).toBe(0);
    expect(() => mapearResultadosIncentivos({ ds3: { car_avan_fix: 'ilegible' } }, cfg, nivel, true)).toThrow();
  });
});
