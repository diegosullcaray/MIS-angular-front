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

  it('muestra el overlay y el spinner cuando isLoading es true', () => {
    mockEstado.set({ isLoading: true, requestCount: 1 });
    const fixture = TestBed.createComponent(LoadingOverlayComponent);
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('.loading-overlay-wrapper');
    expect(overlay).toBeTruthy();
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
