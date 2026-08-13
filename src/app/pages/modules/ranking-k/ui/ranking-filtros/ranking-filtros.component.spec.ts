import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { RankingFiltrosComponent } from './ranking-filtros.component';
import { ToastService } from '../../../../../shared/services/toast.service';
import type { RankingFiltros } from '../../models/ranking-filtros.model';

describe('RankingFiltrosComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RankingFiltrosComponent],
      providers: [MessageService],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(RankingFiltrosComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('el rango de puntos y los lugares del modelo se inicializan con los límites reales de la data (inputs)', () => {
    const fixture = TestBed.createComponent(RankingFiltrosComponent);
    fixture.componentRef.setInput('puntosMinDisponible', 40);
    fixture.componentRef.setInput('puntosMaxDisponible', 300);
    fixture.componentRef.setInput('lugaresDisponibles', ['Norte', 'Sur']);
    fixture.detectChanges();

    const modelo = fixture.componentInstance['model']();
    expect(modelo.rangoPuntos).toEqual([40, 300]);
    expect(modelo.lugares).toEqual(['Norte', 'Sur']);
  });

  it('onLimitePosicionesChange() actualiza limitePosiciones en el modelo', () => {
    const fixture = crear();
    fixture.componentInstance['onLimitePosicionesChange'](50);
    expect(fixture.componentInstance['model']().limitePosiciones).toBe(50);
  });

  it('onLugaresChange() actualiza los lugares seleccionados en el modelo', () => {
    const fixture = crear();
    fixture.componentInstance['onLugaresChange'](['Norte']);
    expect(fixture.componentInstance['model']().lugares).toEqual(['Norte']);
  });

  it('onRangoPuntosChange() actualiza el rango de puntos en el modelo', () => {
    const fixture = crear();
    fixture.componentInstance['onRangoPuntosChange']([10, 90]);
    expect(fixture.componentInstance['model']().rangoPuntos).toEqual([10, 90]);
  });

  it('onAplicar() emite el criterio de filtros derivado del modelo y muestra un toast de éxito', () => {
    const fixture = crear();
    const toast = TestBed.inject(ToastService);
    const toastSpy = vi.spyOn(toast, 'exito');

    fixture.componentInstance['model'].set({ usuario: 'juan', lugares: ['Norte'], rangoPuntos: [10, 90], limitePosiciones: 20 });

    let emitido: RankingFiltros | undefined;
    fixture.componentInstance.aplicarFiltros.subscribe((f) => (emitido = f));
    fixture.componentInstance['onAplicar']();

    expect(emitido).toEqual({ usuario: 'juan', puntosMin: 10, puntosMax: 90, lugares: ['Norte'], limitePosiciones: 20 });
    expect(toastSpy).toHaveBeenCalled();
  });

  it('onLimpiar() restablece el modelo a los límites por defecto y emite el filtro reseteado con un toast informativo', () => {
    const fixture = TestBed.createComponent(RankingFiltrosComponent);
    fixture.componentRef.setInput('puntosMinDisponible', 0);
    fixture.componentRef.setInput('puntosMaxDisponible', 500);
    fixture.componentRef.setInput('lugaresDisponibles', ['Norte', 'Sur']);
    fixture.detectChanges();

    const toast = TestBed.inject(ToastService);
    const toastSpy = vi.spyOn(toast, 'info');
    fixture.componentInstance['onLimitePosicionesChange'](50);

    let emitido: RankingFiltros | undefined;
    fixture.componentInstance.aplicarFiltros.subscribe((f) => (emitido = f));
    fixture.componentInstance['onLimpiar']();

    expect(fixture.componentInstance['model']()).toEqual({ usuario: '', rangoPuntos: [0, 500], lugares: ['Norte', 'Sur'], limitePosiciones: 0 });
    expect(emitido).toEqual({ usuario: '', puntosMin: 0, puntosMax: 500, lugares: ['Norte', 'Sur'], limitePosiciones: 0 });
    expect(toastSpy).toHaveBeenCalled();
  });
});
