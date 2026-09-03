import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { MapaUbicacionComponent } from './mapa-ubicacion.component';
import { ThemeService } from '../../../services/theme.service';

vi.mock('maplibre-gl', () => {
  class MockMapLibreMap {
    on = vi.fn();
    easeTo = vi.fn();
    zoomIn = vi.fn();
    zoomOut = vi.fn();
    remove = vi.fn();
    resize = vi.fn();
  }
  class MockMarker {
    setLngLat = vi.fn().mockReturnThis();
    addTo = vi.fn().mockReturnThis();
    remove = vi.fn();
  }
  return {
    MapLibreMap: MockMapLibreMap,
    Marker: MockMarker,
  };
});

class ResizeObserverMock {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

describe('MapaUbicacionComponent', () => {
  let mockThemeService: { oscuro: ReturnType<typeof signal<boolean>> };

  beforeAll(() => {
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = ResizeObserverMock;
  });

  beforeEach(() => {
    mockThemeService = {
      oscuro: signal(false),
    };

    TestBed.configureTestingModule({
      imports: [MapaUbicacionComponent],
      providers: [{ provide: ThemeService, useValue: mockThemeService }],
    });
  });

  it('se crea correctamente y computa las coordenadas formateadas', () => {
    const fixture = TestBed.createComponent(MapaUbicacionComponent);
    fixture.componentRef.setInput('lat', -12.04637);
    fixture.componentRef.setInput('lng', -77.04279);
    fixture.componentRef.setInput('etiqueta', 'Agencia Central');
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Agencia Central');
    expect(fixture.nativeElement.textContent).toContain('-12.04637, -77.04279');
  });

  it('permite accionar los botones de control de zoom', () => {
    const fixture = TestBed.createComponent(MapaUbicacionComponent);
    fixture.componentRef.setInput('lat', -12.04637);
    fixture.componentRef.setInput('lng', -77.04279);
    fixture.detectChanges();

    const botones = fixture.nativeElement.querySelectorAll('button');
    expect(botones.length).toBe(3); // acercar, alejar, recentrar

    botones[0].click(); // acercar
    botones[1].click(); // alejar
    botones[2].click(); // recentrar
    expect(fixture.componentInstance).toBeTruthy();
  });
});
