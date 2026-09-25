import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { BloqueReporteService } from './bloque-reporte.service';
import { ModReportesService } from '../../../../core/winder/instances/mod-reportes.service';
import { TABLA_PENDIENTE, type TablaReporteResultado } from '../models/tabla-reporte.model';

const NODO = { tip_cod: 9, cod_rel: 'FC' };

/** Respuesta de Winder con una fila que identifica al bloque. */
function respuesta(codRep: string) {
  return { code: '0', headers: {}, body: { result: { headers: [], body: [{ cod: codRep }], additional: {} } } };
}

/** Carga independiente: cada bloque se entrega apenas responde, sin esperar al más lento. */
describe('BloqueReporteService.regulares()', () => {
  let respuestas: Record<string, Subject<unknown>>;
  let servicio: BloqueReporteService;

  beforeEach(() => {
    respuestas = { A: new Subject(), B: new Subject(), C: new Subject() };
    const getRegularData = vi.fn((codRep: string) => respuestas[codRep]);
    TestBed.configureTestingModule({ providers: [{ provide: ModReportesService, useValue: { getRegularData } }] });
    servicio = TestBed.inject(BloqueReporteService);
  });

  function responder(codRep: string): void {
    respuestas[codRep].next(respuesta(codRep));
    respuestas[codRep].complete();
  }

  it('emite con el primer bloque que responde, dejando los demás pendientes y en su orden', () => {
    const emisiones: TablaReporteResultado[][] = [];
    servicio.regulares([{ codRep: 'A' }, { codRep: 'B' }, { codRep: 'C' }], NODO).subscribe((t) => emisiones.push(t));

    responder('B');
    expect(emisiones).toHaveLength(1);
    expect(emisiones[0][0]).toBe(TABLA_PENDIENTE);
    expect(emisiones[0][1].body).toEqual([{ cod: 'B' }]);
    expect(emisiones[0][2]).toBe(TABLA_PENDIENTE);

    responder('C');
    responder('A');
    const ultima = emisiones.at(-1)!;
    expect(ultima.map((t) => t.body[0]?.['cod'])).toEqual(['A', 'B', 'C']);
    expect(ultima).not.toContain(TABLA_PENDIENTE);
  });

  it('si un bloque falla, la consulta falla', () => {
    const error = vi.fn();
    servicio.regulares([{ codRep: 'A' }, { codRep: 'B' }], NODO).subscribe({ error });
    respuestas['A'].error(new Error('500'));
    expect(error).toHaveBeenCalled();
  });
});
