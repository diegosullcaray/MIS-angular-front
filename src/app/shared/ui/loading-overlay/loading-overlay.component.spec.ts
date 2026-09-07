import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { LoadingOverlayComponent } from './loading-overlay.component';
import { LoadingService, type LoadingState } from '../../services/loading.service';

describe('LoadingOverlayComponent', () => {
  let mockEstado: ReturnType<typeof signal<LoadingState>>;
  let mockLoadingService: Partial<LoadingService>;

  beforeEach(() => {
    mockEstado = signal<LoadingState>({ isLoading: false, requestCount: 0 });
    mockLoadingService = {
      estado: mockEstado.asReadonly(),
    };

    TestBed.configureTestingModule({
      imports: [LoadingOverlayComponent],
      providers: [{ provide: LoadingService, useValue: mockLoadingService }],
    });
  });

  it('no muestra el overlay cuando isLoading es false', () => {
    const fixture = TestBed.createComponent(LoadingOverlayComponent);
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('.loading-overlay-wrapper');
    expect(overlay).toBeNull();
  });

  // El anillo es lo que comunica que algo está en curso; el Puma solo acompaña.
  it('muestra el anillo y el Puma de espera cuando isLoading es true', () => {
    mockEstado.set({ isLoading: true, requestCount: 1 });
    const fixture = TestBed.createComponent(LoadingOverlayComponent);
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('.loading-overlay-wrapper');
    expect(overlay).toBeTruthy();
    expect(overlay.getAttribute('aria-busy')).toBe('true');
    expect(overlay.querySelector('p-progress-spinner')).not.toBeNull();
    expect(overlay.querySelector('img.loading-avatar')?.getAttribute('src')).toContain('mis_wait.png');
  });

  // La mascota es decorativa: quien usa lector de pantalla necesita el texto,
  // no la descripción del dibujo.
  it('el Puma queda fuera del árbol de accesibilidad y siempre hay texto', () => {
    mockEstado.set({ isLoading: true, requestCount: 1 });
    const fixture = TestBed.createComponent(LoadingOverlayComponent);
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('.loading-overlay-wrapper');
    expect(overlay.querySelector('img')?.getAttribute('aria-hidden')).toBe('true');
    expect(overlay.textContent).toContain('Cargando');
  });

  it('muestra el mensaje personalizado si está presente', () => {
    mockEstado.set({ isLoading: true, message: 'Cargando datos...', requestCount: 1 });
    const fixture = TestBed.createComponent(LoadingOverlayComponent);
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('.loading-overlay-wrapper');
    expect(overlay).toBeTruthy();
    expect(overlay.textContent).toContain('Cargando datos...');
  });
});
