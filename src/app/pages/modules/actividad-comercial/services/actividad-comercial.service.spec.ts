import { TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';
import { ModReportesService } from '../../../../core/winder/instances/mod-reportes.service';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import { COD_TABLERO_SEGUIMIENTO } from '../constantes/actividad-comercial.constantes';
import type { TableroAsesor } from '../models/actividad-comercial.model';
import { ActividadComercialService, type NodoTablero } from './actividad-comercial.service';

const NODO: NodoTablero = { tip_cod: 18, cod_rel: '45', des_rel: 'Unidad Norte' };
const TABLERO = { entidad: 'Unidad Norte' } as TableroAsesor;

class ServicioControlado extends ActividadComercialService {
  fuente: Observable<TableroAsesor | null> = new Subject<TableroAsesor | null>();
  protected override obtener(): Observable<TableroAsesor | null> {
    return this.fuente;
  }
}

describe('ActividadComercialService', () => {
  function crear(): ServicioControlado {
    TestBed.configureTestingModule({ providers: [ServicioControlado] });
    return TestBed.inject(ServicioControlado);
  }

  it('arranca sin datos, sin carga y sin error', () => {
    const servicio = crear();

    expect(servicio.tablero()).toBeNull();
    expect(servicio.cargando()).toBe(false);
    expect(servicio.error()).toBeNull();
    expect(servicio.vacio()).toBe(false);
  });

  it('consultar() marca la carga y publica el tablero al responder', () => {
    const servicio = crear();
    const fuente = new Subject<TableroAsesor | null>();
    servicio.fuente = fuente;

    servicio.consultar(NODO);
    expect(servicio.cargando()).toBe(true);

    fuente.next(TABLERO);
    expect(servicio.tablero()).toBe(TABLERO);
    expect(servicio.cargando()).toBe(false);
    expect(servicio.vacio()).toBe(false);
  });

  it('una entidad sin fila es vacío, no error', () => {
    const servicio = crear();
    servicio.fuente = of(null);

    servicio.consultar(NODO);

    expect(servicio.vacio()).toBe(true);
    expect(servicio.error()).toBeNull();
    expect(servicio.tablero()).toBeNull();
  });

  it('un fallo se expone como error y no como tablero vacío', () => {
    const servicio = crear();
    servicio.fuente = throwError(() => new Error('falló'));

    servicio.consultar(NODO);

    expect(servicio.error()).toContain('No se pudo cargar');
    expect(servicio.vacio()).toBe(false);
    expect(servicio.tablero()).toBeNull();
    expect(servicio.cargando()).toBe(false);
  });

  it('una consulta nueva cancela la anterior: la respuesta tardía no pisa a la vigente', () => {
    const servicio = crear();
    const vieja = new Subject<TableroAsesor | null>();
    const nueva = new Subject<TableroAsesor | null>();

    servicio.fuente = vieja;
    servicio.consultar(NODO);
    servicio.fuente = nueva;
    servicio.consultar(NODO);

    vieja.next({ entidad: 'VIEJA' } as TableroAsesor);
    expect(servicio.tablero()).toBeNull();

    nueva.next(TABLERO);
    expect(servicio.tablero()?.entidad).toBe('Unidad Norte');
  });
});

describe('ActividadComercialService (consulta al reporte)', () => {
  function crearConBackend(respuesta: unknown, fechaCorte = '20261014') {
    const getRegularTableResult = vi.fn().mockReturnValue(of({ body: respuesta }));
    TestBed.configureTestingModule({
      providers: [
        ActividadComercialService,
        { provide: ModReportesService, useValue: { getRegularTableResult } },
        { provide: ShellStateService, useValue: { usuarioActivo: () => ({ fechaCorte }) } },
      ],
    });
    return { servicio: TestBed.inject(ActividadComercialService), getRegularTableResult };
  }

  it('pide TAB_SEG_01 con tip_cod, cod_rel y el corte del usuario en YYYY-MM-DD', () => {
    const { servicio, getRegularTableResult } = crearConBackend({ resultado: { data: [{ fec_corte: '2026-10-14', tip_cod: 18 }] } });

    servicio.consultar(NODO);

    expect(getRegularTableResult).toHaveBeenCalledWith(COD_TABLERO_SEGUIMIENTO, { tip_cod: 18, cod_rel: '45', fec: '2026-10-14' });
    expect(servicio.tablero()?.entidad).toBe('Unidad Norte');
    expect(servicio.tablero()?.corte).toBe('14/10/2026');
  });

  it('sin filas en la respuesta queda vacío', () => {
    const { servicio } = crearConBackend({ resultado: { data: [] } });

    servicio.consultar(NODO);

    expect(servicio.vacio()).toBe(true);
  });
});
