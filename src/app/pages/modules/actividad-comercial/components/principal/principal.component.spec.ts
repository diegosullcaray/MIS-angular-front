import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, input, output } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Observable, Subject, of, throwError } from 'rxjs';
import { HierSelectorComponent } from '../../../../../shared/ui/hier-selector/hier-selector.component';
import type { HierarquiaNodo } from '../../../../../shared/ui/hier-selector/jerarquia.model';
import type { TableroAsesor } from '../../models/actividad-comercial.model';
import { ActividadComercialService } from '../../services/actividad-comercial.service';
import { mapearTablero } from '../../utils/tablero-seguimiento.mapeo.util';
import { PrincipalComponent } from './principal.component';

class ServicioControlado extends ActividadComercialService {
  fuente: Observable<TableroAsesor | null> = new Subject<TableroAsesor | null>();
  protected override obtener(): Observable<TableroAsesor | null> {
    return this.fuente;
  }
}

/** Selector de jerarquía de prueba: el real consulta al backend; aquí el test elige el nodo. */
@Component({ selector: 'app-hier-selector', standalone: true, template: '' })
class HierSelectorFalso {
  readonly paramsHier = input<unknown>();
  readonly placeholder = input<string>();
  readonly nodoSeleccionado = output<HierarquiaNodo>();
  readonly error = output<void>();
}

const NODO: HierarquiaNodo = { tip_cod: 18, cod_rel: '45', des_rel: 'Unidad Norte' };
const TABLERO = mapearTablero({ fec_corte: '2026-10-14', tip_cod: 18, ind_seg_pendiente: 0 }, 'Unidad Norte');

describe('PrincipalComponent (Actividad Comercial)', () => {
  function montar(fuente: Observable<TableroAsesor | null>): ComponentFixture<PrincipalComponent> {
    TestBed.configureTestingModule({
      providers: [{ provide: ActividadComercialService, useClass: ServicioControlado }, MessageService],
    }).overrideComponent(PrincipalComponent, { remove: { imports: [HierSelectorComponent] }, add: { imports: [HierSelectorFalso] } });
    (TestBed.inject(ActividadComercialService) as ServicioControlado).fuente = fuente;
    const fixture = TestBed.createComponent(PrincipalComponent);
    fixture.detectChanges();
    return fixture;
  }

  function elegirNivel(fixture: ComponentFixture<PrincipalComponent>): void {
    fixture.debugElement.query((d) => d.name === 'app-hier-selector').componentInstance.nodoSeleccionado.emit(NODO);
    fixture.detectChanges();
    TestBed.tick();
    fixture.detectChanges();
  }

  const raiz = (fixture: ComponentFixture<PrincipalComponent>) => fixture.nativeElement as HTMLElement;

  it('sin nivel elegido pide elegirlo y no consulta', () => {
    const el = raiz(montar(new Subject<TableroAsesor | null>()));

    expect(el.textContent).toContain('Elige un nivel');
    expect(el.querySelector('app-tarjeta-cartera')).toBeNull();
  });

  it('mientras carga muestra el esqueleto y ninguna tarjeta', () => {
    const fixture = montar(new Subject<TableroAsesor | null>());

    elegirNivel(fixture);

    expect(raiz(fixture).querySelector('app-list-skeleton')).not.toBeNull();
    expect(raiz(fixture).querySelector('app-tarjeta-cartera')).toBeNull();
  });

  it('con el tablero pinta las seis tarjetas, Digital en lugar de Desempeño, y el corte', () => {
    const fixture = montar(of(TABLERO));

    elegirNivel(fixture);

    const el = raiz(fixture);
    for (const tarjeta of ['cartera', 'desembolsos', 'mora', 'clientes', 'digital', 'seguros']) {
      expect(el.querySelector(`app-tarjeta-${tarjeta}`), tarjeta).not.toBeNull();
    }
    expect(el.querySelector('app-tarjeta-desempeno')).toBeNull();
    expect(el.textContent).toContain('Corte al 14/10/2026');
  });

  it('una entidad sin fila se muestra como vacío', () => {
    const fixture = montar(of(null));

    elegirNivel(fixture);

    expect(raiz(fixture).textContent).toContain('Sin información');
  });

  it('un error se muestra como error, no como tablero vacío', () => {
    const fixture = montar(throwError(() => new Error('falló')));

    elegirNivel(fixture);

    expect(raiz(fixture).querySelector('app-inline-error')).not.toBeNull();
    expect(raiz(fixture).querySelector('app-tarjeta-digital')).toBeNull();
  });
});
