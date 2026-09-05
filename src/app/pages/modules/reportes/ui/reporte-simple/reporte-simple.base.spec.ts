import { Component, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import type { Observable } from 'rxjs';
import { ReporteSimpleBase } from './reporte-simple.base';
import { ToastService } from '../../../../../shared/services/toast.service';
import type { NodoConsulta } from '../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../models/tabla-reporte.model';

const NODO = { tip_cod: 2, cod_rel: 'AG01', lvl: 2 };

function bloque(marca: string): ReporteBloqueUnico {
  return { tabla1: { headers: [], body: [{ marca }], additional: {} } };
}

/** Doble de un reporte con un filtro propio, como los migrados de `report-cra-v1p1`. */
@Component({ selector: 'app-reporte-doble', standalone: true, template: '' })
class ReporteDobleComponent extends ReporteSimpleBase {
  readonly consultas: { nodo: NodoConsulta; prod: string }[] = [];
  readonly producto = signal('TODOS');
  fallar = false;

  protected consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    const prod = this.producto();
    this.consultas.push({ nodo, prod });
    return this.fallar ? throwError(() => new Error('boom')) : of(bloque(prod));
  }

  // Acceso para el test (en la clase base son `protected`).
  get estado() {
    return { tabla: this.tabla, cargando: this.cargando, nivel: this.nivelActual };
  }
  seleccionar(nodo: typeof NODO) {
    this.onNivelSeleccionado(nodo);
  }
}

describe('ReporteSimpleBase', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<ReporteDobleComponent>>;
  let componente: ReporteDobleComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ToastService, MessageService] });
    fixture = TestBed.createComponent(ReporteDobleComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('no consulta nada mientras no haya nivel elegido', () => {
    expect(componente.consultas).toEqual([]);
    expect(componente.estado.tabla().body).toEqual([]);
  });

  it('consulta al elegir un nivel y expone la tabla del bloque', () => {
    componente.seleccionar(NODO);
    fixture.detectChanges();

    // El nodo llega COMPLETO: los reportes paginados reenvían también sus
    // campos de jerarquía. El recorte a `tip_cod`/`cod_rel` lo hace
    // `BloqueReporteService.regular()`, no esta base.
    expect(componente.consultas).toEqual([{ nodo: NODO, prod: 'TODOS' }]);
    expect(componente.estado.tabla().body).toEqual([{ marca: 'TODOS' }]);
    expect(componente.estado.cargando()).toBe(false);
  });

  it('vuelve a consultar cuando cambia un filtro, sin reelegir el nivel', () => {
    componente.seleccionar(NODO);
    fixture.detectChanges();

    componente.producto.set('CTS');
    fixture.detectChanges();

    expect(componente.consultas.map((c) => c.prod)).toEqual(['TODOS', 'CTS']);
    expect(componente.estado.tabla().body).toEqual([{ marca: 'CTS' }]);
  });

  it('un filtro que cambia antes de elegir nivel no dispara consultas', () => {
    componente.producto.set('AHORROS');
    fixture.detectChanges();

    expect(componente.consultas).toEqual([]);
  });

  it('ante un error avisa y suelta el indicador de carga', () => {
    const errorSpy = vi.spyOn(TestBed.inject(ToastService), 'error');
    componente.fallar = true;

    componente.seleccionar(NODO);
    fixture.detectChanges();

    expect(errorSpy).toHaveBeenCalled();
    expect(componente.estado.cargando()).toBe(false);
  });
});
