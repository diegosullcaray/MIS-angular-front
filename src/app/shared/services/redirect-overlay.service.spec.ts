import { TestBed } from '@angular/core/testing';
import { RedirectOverlayService } from './redirect-overlay.service';
import { environment } from '../../../environments/environment';

describe('RedirectOverlayService', () => {
  let service: RedirectOverlayService;
  let openSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RedirectOverlayService);
    vi.useFakeTimers();
    openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    vi.useRealTimers();
    openSpy.mockRestore();
  });

  it('empieza oculto', () => {
    expect(service.state().visible).toBe(false);
  });

  it('redirigir() muestra el overlay de inmediato con el nombre amigable del destino', () => {
    service.redirigir('imparables');

    expect(service.state().visible).toBe(true);
    expect(service.state().subtitulo).toContain('Portal Imparables');
  });

  it('redirigir() usa la urlDirecta del backend si se pasa, en vez de environment', () => {
    service.redirigir('jira', 'https://jira.custom.example/servicedesk');

    expect(service.state().url).toBe('https://jira.custom.example/servicedesk');
  });

  it('redirigir() cae a environment.externalLinks cuando no hay urlDirecta', () => {
    service.redirigir('jira');

    expect(service.state().url).toBe(environment.externalLinks.jira);
  });

  it('redirigir() abre la URL en una pestaña nueva tras 1.5s y oculta el overlay 400ms después', () => {
    service.redirigir('helpdesk');

    expect(openSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1500);
    expect(openSpy).toHaveBeenCalledWith(environment.externalLinks.helpdesk, '_blank', 'noopener,noreferrer');
    expect(service.state().visible).toBe(true); // todavía visible, faltan los 400ms

    vi.advanceTimersByTime(400);
    expect(service.state().visible).toBe(false);
  });
});
