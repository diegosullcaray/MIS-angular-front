import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MonitorSalidasService } from './monitor-salidas.service';
import { ModRep2Service } from '../../../../../../../../core/winder/instances/mod-rep2.service';
import { ShellStateService } from '../../../../../../../../core/services/shell-state.service';
import type { UsuarioActivo } from '../../../../../../../../core/interfaces/shell-state.model';
import { colorChurn, metricaDeTarjeta } from '../models/monitor-salidas.model';

const NODO = { tip_cod: 9, cod_rel: 'FC' };

function usuario(): UsuarioActivo {
  return { id: '1', nombre: 'Ana', email: 'ana@confianza.pe', rol: 'admin-general', subsistemas: [], fechaCorte: '20251130' };
}

describe('MonitorSalidasService', () => {
  let getMonSalidasResultados: ReturnType<typeof vi.fn>;
  let getMonSalidasDetalle: ReturnType<typeof vi.fn>;
  let servicio: MonitorSalidasService;

  beforeEach(() => {
    getMonSalidasResultados = vi.fn().mockReturnValue(of({ code: '0', headers: {}, body: { resultado: { cards: [], table: [] } } }));
    getMonSalidasDetalle = vi.fn().mockReturnValue(of({ code: '0', headers: {}, body: { resultado: [] } }));

    TestBed.configureTestingModule({
      providers: [{ provide: ModRep2Service, useValue: { getMonSalidasResultados, getMonSalidasDetalle } }],
    });
    TestBed.inject(ShellStateService).setUsuarioActivo(usuario());
    servicio = TestBed.inject(MonitorSalidasService);
  });

  it('pide las tarjetas y la tabla del nivel con la fecha de corte', () => {
    servicio.resultados(NODO).subscribe();
    expect(getMonSalidasResultados).toHaveBeenCalledWith({ tip_cod: 9, cod_rel: 'FC', fec: '2025-11-30' });
  });

  it('separa `cards` de `table`, y tolera que el backend no mande alguno', () => {
    getMonSalidasResultados.mockReturnValue(of({ code: '0', headers: {}, body: { resultado: { cards: [{ lbl: 'X', val: 1 }] } } }));

    let r: { cards: unknown[]; table: unknown[] } | undefined;
    servicio.resultados(NODO).subscribe((x) => (r = x));

    expect(r!.cards).toHaveLength(1);
    expect(r!.table).toEqual([]);
  });

  it.each([
    ['sali1', 1],
    ['sali3', 2],
    ['clive', 3],
  ])('traduce la métrica %s al `tip` %i que espera el backend', (metrica, tip) => {
    servicio.detalle(NODO, metrica as string, 25).subscribe();
    expect(getMonSalidasDetalle).toHaveBeenCalledWith({ tip_cod: 9, cod_rel: 'FC', fec: '2025-11-30', tip, top: 25 });
  });
});

describe('metricaDeTarjeta', () => {
  it('las tarjetas 0 y 3 no abren detalle, como en el legado', () => {
    expect(metricaDeTarjeta(0)).toBeUndefined();
    expect(metricaDeTarjeta(3)).toBeUndefined();
  });

  it('las demás mapean a su métrica de la tabla', () => {
    expect(metricaDeTarjeta(1)).toBe('sali1');
    expect(metricaDeTarjeta(2)).toBe('sali3');
    expect(metricaDeTarjeta(4)).toBe('clive');
  });
});

describe('colorChurn', () => {
  it('acá más alto es mejor: verde desde 0.95', () => {
    expect(colorChurn(0.96)).toBe('var(--mis-success)');
    expect(colorChurn(0.95)).toBe('var(--mis-success)');
  });

  it('ámbar entre 0.9025 y 0.95', () => {
    expect(colorChurn(0.93)).toBe('var(--mis-warning)');
  });

  it('rojo por debajo de 0.9025, y también sin dato', () => {
    expect(colorChurn(0.9)).toBe('var(--mis-danger)');
    expect(colorChurn(null)).toBe('var(--mis-danger)');
    expect(colorChurn(undefined)).toBe('var(--mis-danger)');
  });
});
