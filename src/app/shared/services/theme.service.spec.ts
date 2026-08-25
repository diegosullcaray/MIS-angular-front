import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let mediaOscuro: boolean;

  function crear(): ThemeService {
    TestBed.configureTestingModule({});
    return TestBed.inject(ThemeService);
  }

  beforeEach(() => {
    mediaOscuro = false;
    localStorage.clear();
    document.documentElement.classList.remove('dark');

    window.matchMedia = ((consulta: string) => ({
      matches: consulta.includes('dark') && mediaOscuro,
      media: consulta,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
  });

  it('arranca en oscuro cuando no hay preferencia guardada, sin mirar al sistema', () => {
    // El SO está en claro y aun así el sistema arranca oscuro: es el tema por
    // defecto del producto, no un reflejo de `prefers-color-scheme`.
    mediaOscuro = false;
    const theme = crear();

    expect(theme.modo()).toBe('oscuro');
    expect(theme.oscuro()).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('en modo "sistema" sigue a prefers-color-scheme', () => {
    localStorage.setItem('mis-tema', 'sistema');
    mediaOscuro = true;
    const theme = crear();

    expect(theme.oscuro()).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('aplica y quita la clase .dark en <html> al cambiar de modo', () => {
    localStorage.setItem('mis-tema', 'claro');
    const theme = crear();
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    theme.setModo('oscuro');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    theme.setModo('claro');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('persiste la preferencia y la recupera en la siguiente sesión', () => {
    crear().setModo('claro');
    TestBed.resetTestingModule();

    expect(crear().modo()).toBe('claro');
  });

  it('alternar() usa el tema visible como punto de partida', () => {
    localStorage.setItem('mis-tema', 'sistema');
    mediaOscuro = true;
    const theme = crear();

    // En "sistema" con el SO en oscuro, lo visible es oscuro: alternar va a claro.
    theme.alternar();
    expect(theme.modo()).toBe('claro');

    theme.alternar();
    expect(theme.modo()).toBe('oscuro');
  });

  it('ignora un valor corrupto en localStorage y cae al tema por defecto', () => {
    localStorage.setItem('mis-tema', 'turquesa');
    expect(crear().modo()).toBe('oscuro');
  });
});
