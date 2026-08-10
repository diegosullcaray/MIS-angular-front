import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { AvanceComercialComponent } from './avance-comercial.component';
import { ReportesService } from '../../services/reportes.service';

// jsdom no implementa ResizeObserver — lo usa internamente PrimeNG Tabs.
class ResizeObserverFalso {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

describe('AvanceComercialComponent', () => {
  beforeEach(() => {
    (globalThis as unknown as { ResizeObserver: typeof ResizeObserverFalso }).ResizeObserver = ResizeObserverFalso;

    TestBed.configureTestingModule({
      imports: [AvanceComercialComponent],
      providers: [{ provide: ReportesService, useValue: {} }, MessageService],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(AvanceComercialComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('muestra el título y las 2 pestañas de reportes', () => {
    const fixture = crear();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(texto).toContain('Avance Comercial');
    expect(texto).toContain('Monitor Metas Desembolso');
    expect(texto).toContain('Monitor Reprogramados');
  });

  it('empieza con la pestaña "Monitor Metas Desembolso" activa', () => {
    const fixture = crear();
    expect(fixture.componentInstance['tabActiva']()).toBe('mon-desem');
  });
});
