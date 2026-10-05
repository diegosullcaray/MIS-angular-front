import { mapActividadComercialFila, mapActividadComercialFilas, totalActividadComercial } from './actividad-comercial.util';
import type { ActividadComercialFilaDto } from '../models/actividad-comercial.model';

describe('actividad-comercial.util', () => {
  const dto: ActividadComercialFilaDto = { cod: 'C-01', des: 'Operación de prueba', mto: 1500.5, est: 'ACTIVO' };

  it('normaliza una fila del backend', () => {
    const fila = mapActividadComercialFila(dto);

    expect(fila.codigo).toBe('C-01');
    expect(fila.monto).toBe(1500.5);
    expect(fila.activo).toBe(true);
    expect(fila.montoFormateado).toContain('1');
  });

  it('acepta montos en cadena, que es como los manda parte del backend', () => {
    expect(mapActividadComercialFila({ ...dto, mto: '2 300,00' }).monto).toBe(2300);
    expect(mapActividadComercialFila({ ...dto, mto: '1.250,75' }).monto).toBe(1250.75);
    expect(mapActividadComercialFila({ ...dto, mto: 'S/ 1,250.75' }).monto).toBe(1250.75);
  });

  it('trata null, undefined y campos faltantes como vacío y no como excepción', () => {
    expect(mapActividadComercialFilas(null)).toEqual([]);
    expect(mapActividadComercialFilas(undefined)).toEqual([]);
    expect(mapActividadComercialFilas([])).toEqual([]);

    const vacia = mapActividadComercialFila({} as ActividadComercialFilaDto);
    expect(vacia.monto).toBe(0);
    expect(vacia.activo).toBe(false);
  });

  it('suma los montos de las filas', () => {
    expect(totalActividadComercial(mapActividadComercialFilas([dto, { ...dto, mto: 500 }]))).toBe(2000.5);
  });

  it('rechaza una estructura inválida en lugar de convertirla en vacío', () => {
    expect(() => mapActividadComercialFilas({} as never)).toThrow();
    expect(() => mapActividadComercialFila({ ...dto, mto: 'inválido' })).toThrow();
  });
});
