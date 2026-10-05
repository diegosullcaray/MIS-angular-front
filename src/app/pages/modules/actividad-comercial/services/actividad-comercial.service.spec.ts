import { TestBed } from '@angular/core/testing';
import { Observable, Subject, throwError } from 'rxjs';
import { TABLERO_DEMO } from '../constantes/actividad-comercial-demo.constantes';
import type { TableroAsesor } from '../models/actividad-comercial.model';
import { ActividadComercialService } from './actividad-comercial.service';

class ServicioControlado extends ActividadComercialService {
  fuente: Observable<TableroAsesor> = new Subject<TableroAsesor>();
  protected override obtener(): Observable<TableroAsesor> {
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
  });

  it('consultar() marca la carga y publica el tablero al responder', () => {
    const servicio = crear();
    const fuente = new Subject<TableroAsesor>();
    servicio.fuente = fuente;

    servicio.consultar();
    expect(servicio.cargando()).toBe(true);

    fuente.next(TABLERO_DEMO);
    expect(servicio.tablero()).toBe(TABLERO_DEMO);
    expect(servicio.cargando()).toBe(false);
  });

  it('un fallo se expone como error y no como tablero vacío', () => {
    const servicio = crear();
    servicio.fuente = throwError(() => new Error('falló'));

    servicio.consultar();

    expect(servicio.error()).toContain('No se pudo cargar');
    expect(servicio.tablero()).toBeNull();
    expect(servicio.cargando()).toBe(false);
  });

  it('una consulta nueva cancela la anterior: la respuesta tardía no pisa a la vigente', () => {
    const servicio = crear();
    const vieja = new Subject<TableroAsesor>();
    const nueva = new Subject<TableroAsesor>();

    servicio.fuente = vieja;
    servicio.consultar();
    servicio.fuente = nueva;
    servicio.consultar();

    vieja.next({ ...TABLERO_DEMO, asesor: 'VIEJA' });
    expect(servicio.tablero()).toBeNull();

    nueva.next(TABLERO_DEMO);
    expect(servicio.tablero()?.asesor).toBe(TABLERO_DEMO.asesor);
  });
});
