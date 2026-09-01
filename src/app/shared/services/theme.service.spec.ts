import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

/**
 * `ThemeService` dejó de guardar la preferencia: ahora solo la aplica. Quién la
 * elige y dónde queda guardada es asunto de `PreferenciasService`, que tiene sus
 * propios tests — acá se verifica únicamente que el modo termine reflejado en
 * la clase `.dark` de <html>, que es el contrato con PrimeNG y con `tokens.css`.
 */
describe('ThemeService', () => {
  let mediaOscuro: boolean;

  function crear(): ThemeService {
    TestBed.configureTestingModule({});
    return TestBed.inject(ThemeService);
  }

  beforeEach(() => {
    mediaOscuro = false;
    document.documentElement.classList.remove('dark');

    window.matchMedia = ((consulta: string) => ({
      matches: consulta.includes('dark') && mediaOscuro,
      media: consulta,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
  });

  it('arranca en oscuro sin mirar al sistema', () => {
    // El SO está en claro y aun así arranca oscuro: es el tema por defecto del
    // producto, no un reflejo de `prefers-color-scheme`.
    mediaOscuro = false;
    const theme = crear();

    expect(theme.modo()).toBe('oscuro');
    expect(theme.oscuro()).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('en modo "sistema" sigue a prefers-color-scheme', () => {
    mediaOscuro = true;
    const theme = crear();
    theme.setModo('sistema');

    expect(theme.oscuro()).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('aplica y quita la clase .dark en <html> al cambiar de modo', () => {
    const theme = crear();

    theme.setModo('claro');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    theme.setModo('oscuro');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    theme.setModo('claro');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('no guarda nada: la preferencia la persiste PreferenciasService', () => {
    crear().setModo('claro');
    TestBed.resetTestingModule();

    // Sin persistencia propia, un servicio nuevo vuelve al tema por defecto.
    expect(crear().modo()).toBe('oscuro');
  });
});
