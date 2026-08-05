import { TestBed } from '@angular/core/testing';
import { RedirectOverlayComponent } from './redirect-overlay.component';
import { RedirectOverlayService } from '../../services/redirect-overlay.service';

describe('RedirectOverlayComponent', () => {
  let service: RedirectOverlayService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [RedirectOverlayComponent] });
    service = TestBed.inject(RedirectOverlayService);
  });

  it('no renderiza nada mientras el overlay no está visible', () => {
    const fixture = TestBed.createComponent(RedirectOverlayComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.redirect-overlay-wrapper')).toBeNull();
  });

  it('muestra el título y subtítulo del estado cuando el overlay está visible', () => {
    const fixture = TestBed.createComponent(RedirectOverlayComponent);
    service.state.set({
      visible: true,
      titulo: 'Redirigiendo...',
      subtitulo: 'Te estamos redirigiendo a Portal Imparables',
      url: 'https://example.com',
      mascotaUrl: '/assets/images/fc/modules/kaypacha/pumas-productivos.png',
    });
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Redirigiendo...');
    expect(texto).toContain('Te estamos redirigiendo a Portal Imparables');
  });
});
