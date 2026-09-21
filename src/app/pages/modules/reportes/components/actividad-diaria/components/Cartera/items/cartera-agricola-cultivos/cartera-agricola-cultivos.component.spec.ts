import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { CarteraAgricolaCultivosComponent } from './cartera-agricola-cultivos.component';
import { CarteraRepositorioService } from '../../services/cartera-repositorio.service';
import type { HierarquiaNodo } from '../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 9, cod_rel: 'FC' };
const REPORTE_VACIO = { tabla: { columnas: [], filas: [] }, totales: [] };


describe('CarteraAgricolaCultivosComponent', () => {
  let servicioSpy: Record<string, ReturnType<typeof vi.fn>>;

  

  beforeEach(() => {
    servicioSpy = {
      carteraAgricola: vi.fn().mockReturnValue(of(REPORTE_VACIO)),
      detalleGraficosAgricola: vi.fn().mockReturnValue(of({ graficos: [], filasPorGrafico: {} })),
      periodosAgricola: vi.fn().mockReturnValue(of([{ id: '202609', desc: 'Setiembre 2026' }])),
    };

    TestBed.configureTestingModule({
      imports: [CarteraAgricolaCultivosComponent],
      providers: [
        MessageService,
        {
      provide: ToastService,
      useValue: {
        error: vi.fn(),
        exito: vi.fn(),
        advertencia: vi.fn(),
        info: vi.fn(),
      },
    },
        { provide: CarteraRepositorioService, useValue: servicioSpy },
      ],
    });
  });

  it('se crea correctamente', () => {
    const fixture = TestBed.createComponent(CarteraAgricolaCultivosComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('al pulsar descripción consulta y expande el siguiente nivel jerárquico', () => {
    const fixture = TestBed.createComponent(CarteraAgricolaCultivosComponent);
    fixture.detectChanges();

    fixture.componentInstance['onCeldaSeleccionada']({
      clave: 'rdesjer',
      fila: { htipcod: 18, cod_rel: 'AG-1', rdesjer: 'Agencia Centro' },
    });

    expect(servicioSpy['carteraAgricola']).toHaveBeenCalledWith({ tip_cod: 18, cod_rel: 'AG-1' }, '202609');
    expect(fixture.componentInstance['filasExpandidas']()).toEqual({ 'AG-1': true });
  });

  it('al pulsar una métrica abre el detalle de gráficos de la misma fila', () => {
    const fixture = TestBed.createComponent(CarteraAgricolaCultivosComponent);
    fixture.detectChanges();

    fixture.componentInstance['onCeldaSeleccionada']({
      clave: 'HSALCAPMN',
      fila: { htipcod: 18, cod_rel: 'AG-1', rdesjer: 'Agencia Centro' },
    });

    expect(servicioSpy['detalleGraficosAgricola']).toHaveBeenCalledWith({ tip_cod: 18, cod_rel: 'AG-1' }, '202609');
  });

});
