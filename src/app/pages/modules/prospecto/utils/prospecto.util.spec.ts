import { mapProspectoFila, mapProspectoFilas } from './prospecto.util';
import type { ProspectoFilaDto } from '../models/prospecto.model';

describe('prospecto.util', () => {
  const dto: ProspectoFilaDto = {
    HFECPRO: '2023-01-01',
    HAPENOMB: 'Juan Perez',
    HNUMDOC: '12345678',
    HNOMCOM: 'Comercial 1',
    HESTDCORE: ' ACTIVO ',
    HFECESTA: '2023-01-02',
    HCANACAP: 'Canal A',
    HDESTER: 'Norte',
    HDESCOR: 'Corredor 1',
    HDESAGE: 'Agencia Centro',
  };

  it('normaliza una fila del backend', () => {
    const fila = mapProspectoFila(dto);

    expect(fila.fecha).toBe('2023-01-01');
    expect(fila.nombre).toBe('Juan Perez');
    expect(fila.documento).toBe('12345678');
    expect(fila.comercial).toBe('Comercial 1');
    expect(fila.estado).toBe('ACTIVO');
    expect(fila.fechaEstado).toBe('2023-01-02');
  });

  it('trata null, undefined y campos faltantes como vacío y no como excepción', () => {
    expect(mapProspectoFilas(null)).toEqual([]);
    expect(mapProspectoFilas(undefined)).toEqual([]);
    expect(mapProspectoFilas([])).toEqual([]);

    const vacia = mapProspectoFila({} as ProspectoFilaDto);
    expect(vacia.fecha).toBe('');
    expect(vacia.estado).toBe('');
  });

  it('rechaza una estructura inválida en lugar de convertirla en vacío', () => {
    expect(() => mapProspectoFilas({} as never)).toThrow();
  });
});
