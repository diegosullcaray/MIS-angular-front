import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { GestionCarteraReasignadaComponent } from './gestion-cartera-reasignada.component';
import { ActividadMensualCraService } from '../../../../services/actividad-mensual-cra.service';
import { TABLA_VACIA } from '../../../../../../models/tabla-reporte.model';
import type { HierarquiaNodo } from '../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 1, cod_rel: '100', desc_rel: 'Unidad 100', lvl: 1 };

describe('GestionCarteraReasignadaComponent (mensual)', () => {
  let servicioSpy: Record<'gestionCarteraReasignadaResumen' | 'gestionCarteraReasignadaDetalle', ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    servicioSpy = {
      gestionCarteraReasignadaResumen: vi.fn().mockReturnValue(of(TABLA_VACIA)),
      gestionCarteraReasignadaDetalle: vi.fn().mockReturnValue(of(TABLA_VACIA)),
    };

    TestBed.configureTestingModule({
      imports: [GestionCarteraReasignadaComponent],
      providers: [{ provide: ActividadMensualCraService, useValue: servicioSpy }, MessageService],
    });
  });

  it('debe crearse correctamente', () => {
    const fixture = TestBed.createComponent(GestionCarteraReasignadaComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('pide el resumen `_01` y el detalle `_03` del reporte de la ruta, el detalle con el nodo completo', () => {
    const fixture = TestBed.createComponent(GestionCarteraReasignadaComponent);
    fixture.componentRef.setInput('reporte', 'RS_AGE_COM_CRM');
    fixture.detectChanges();
    fixture.componentInstance['onNivelSeleccionado'](NODO);
    fixture.detectChanges();

    expect(servicioSpy.gestionCarteraReasignadaResumen).toHaveBeenCalledWith('RS_AGE_COM_CRM', { tip_cod: 1, cod_rel: '100' }, 0, expect.any(String));
    expect(servicioSpy.gestionCarteraReasignadaDetalle).toHaveBeenCalledWith('RS_AGE_COM_CRM', NODO, 0, expect.any(String), 1);
  });

  it('"Mostrar por" y "Fecha Cierre" van lado a lado en una sola baldosa de filtros', () => {
    const fixture = TestBed.createComponent(GestionCarteraReasignadaComponent);
    fixture.detectChanges();
    const grupos = (fixture.nativeElement as HTMLElement).querySelectorAll('app-grupo-filtros');
    expect(grupos.length).toBe(1);
    expect(grupos[0].querySelectorAll('app-select-filtro').length).toBe(2);
  });
});
