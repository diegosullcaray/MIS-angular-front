import { TestBed } from '@angular/core/testing';
import { PreferenciasService } from './preferencias.service';
import { ThemeService } from '../../../shared/services/theme.service';
import { REPOSITORIO_PREFERENCIAS } from '../dominio/repositorio-preferencias.puerto';
import { PreferenciasLocalStorageRepositorio, CLAVE_PREFERENCIAS } from '../infraestructura/preferencias-local-storage.repositorio';
import { PREFERENCIAS_POR_DEFECTO, FONDO_PERSONALIZADO } from '../dominio/preferencias.model';

/**
 * `PreferenciasService` es el caso de uso: persiste (por el puerto) y aplica
 * (por el adaptador de apariencia y `ThemeService`). Los tests miran las dos
 * salidas — lo que queda en `localStorage` y lo que queda escrito en <html>.
 */
describe('PreferenciasService', () => {
  const raiz = document.documentElement;

  function crear(): PreferenciasService {
    TestBed.configureTestingModule({
      providers: [{ provide: REPOSITORIO_PREFERENCIAS, useExisting: PreferenciasLocalStorageRepositorio }],
    });
    return TestBed.inject(PreferenciasService);
  }

  beforeEach(() => {
    localStorage.clear();
    raiz.removeAttribute('style');
    raiz.removeAttribute('data-menu');
    raiz.removeAttribute('data-menu-etiquetas');
    raiz.classList.remove('dark');

    window.matchMedia = ((consulta: string) => ({
      matches: false,
      media: consulta,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
  });

  afterEach(() => {
    localStorage.clear();
    raiz.removeAttribute('style');
  });

  it('arranca en los valores de fábrica cuando no hay nada guardado', () => {
    const preferencias = crear();

    expect(preferencias.preferencias()).toEqual(PREFERENCIAS_POR_DEFECTO);
    expect(preferencias.esPorDefecto()).toBe(true);
  });

  it('guarda todo bajo una sola clave y lo recupera en la siguiente sesión', () => {
    crear().setFondo('navy');

    // Una sola clave, no una por ajuste: es lo que hace exacto el borrado de sesión.
    expect(localStorage.length).toBe(1);
    expect(localStorage.getItem(CLAVE_PREFERENCIAS)).toContain('"fondo":"navy"');

    TestBed.resetTestingModule();
    expect(crear().apariencia().fondo).toBe('navy');
  });

  it('un color de fondo elegido se aplica como variable CSS en <html>', () => {
    const preferencias = crear();
    preferencias.setColorFondo('#123456');
    preferencias.setFondo(FONDO_PERSONALIZADO);
    TestBed.tick();

    expect(raiz.style.getPropertyValue('--mis-wallpaper-color')).toBe('#123456');
    // Con un color plano no hay foto que velar: si el velo siguiera puesto,
    // en tema oscuro ensuciaría el tono que el usuario acaba de elegir.
    expect(raiz.style.getPropertyValue('--mis-wallpaper')).toBe('none');
    expect(raiz.style.getPropertyValue('--mis-wallpaper-velo')).toBe('transparent');
  });

  it('la foto institucional le devuelve el fondo a la hoja de estilos', () => {
    const preferencias = crear();
    preferencias.setFondo('navy');
    TestBed.tick();
    expect(raiz.style.getPropertyValue('--mis-wallpaper-color')).toBe('#1d396e');

    preferencias.setFondo('institucional');
    TestBed.tick();

    // Sin valor inline, mandan `tokens.css` y sus @media de escritorio/oscuro.
    expect(raiz.style.getPropertyValue('--mis-wallpaper-color')).toBe('');
    expect(raiz.style.getPropertyValue('--mis-wallpaper')).toBe('');
    expect(raiz.style.getPropertyValue('--mis-wallpaper-velo')).toBe('');
    // Y también el vidrio de los paneles: si no, volver a la foto los dejaría
    // con la opacidad que se les había puesto para un fondo plano.
    expect(raiz.style.getPropertyValue('--mis-glass-bg')).toBe('');
  });

  it('un fondo plano vuelve opacos los paneles de vidrio para no perder legibilidad', () => {
    const preferencias = crear();
    preferencias.setTema('claro');
    preferencias.setFondo('niebla');
    TestBed.tick();

    expect(raiz.style.getPropertyValue('--mis-glass-bg')).toBe('rgba(255,255,255,0.92)');
  });

  it('un degradado va a background-image, no a background-color', () => {
    const preferencias = crear();
    preferencias.setFondo('degradado-navy');
    TestBed.tick();

    expect(raiz.style.getPropertyValue('--mis-wallpaper')).toContain('linear-gradient');
    expect(raiz.style.getPropertyValue('--mis-wallpaper-color')).toBe('');
  });

  it('el acento deriva sus tonos de hover, variante clara y anillo de foco', () => {
    const preferencias = crear();
    preferencias.setTema('claro');
    preferencias.setAcento('#e11d48');
    TestBed.tick();

    expect(raiz.style.getPropertyValue('--mis-accent')).toBe('#e11d48');
    expect(raiz.style.getPropertyValue('--mis-secondary')).toBe('#e11d48');
    expect(raiz.style.getPropertyValue('--mis-secondary-hover')).not.toBe('#e11d48');
    expect(raiz.style.getPropertyValue('--mis-shadow-focus')).toContain('rgba(225, 29, 72, 0.35)');
    // Sobre un rojo oscuro el texto tiene que ser blanco.
    expect(raiz.style.getPropertyValue('--mis-text-on-secondary')).toBe('#ffffff');
  });

  it('el tema se delega en ThemeService, que es quien pone la clase .dark', () => {
    const preferencias = crear();

    preferencias.setTema('claro');
    TestBed.tick();
    expect(TestBed.inject(ThemeService).modo()).toBe('claro');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    preferencias.alternarTema();
    TestBed.tick();
    expect(preferencias.apariencia().tema).toBe('oscuro');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('publica el modo de menú y las etiquetas como atributos de <html>', () => {
    const preferencias = crear();
    TestBed.tick();
    expect(raiz.dataset['menu']).toBe('estatico');
    expect(raiz.dataset['menuEtiquetas']).toBe('si');

    preferencias.setModoSidebar('horizontal');
    TestBed.tick();
    expect(raiz.dataset['menu']).toBe('horizontal');

    preferencias.setEtiquetasSidebar(false);
    TestBed.tick();
    expect(raiz.dataset['menuEtiquetas']).toBe('no');
    // Sin etiquetas el rail se angosta por token, no por CSS del componente.
    expect(raiz.style.getPropertyValue('--mis-sidebar-col1-w')).toBe('52px');
  });

  it('el modo delgado fuerza "solo íconos" aunque la preferencia diga lo contrario', () => {
    const preferencias = crear();
    preferencias.setEtiquetasSidebar(true);
    preferencias.setModoSidebar('delgado');
    TestBed.tick();

    expect(raiz.dataset['menuEtiquetas']).toBe('no');
  });

  it('restablecer() vuelve a fábrica y borra lo guardado', () => {
    const preferencias = crear();
    preferencias.setFondo('navy');
    preferencias.setAcento('#14b8a6');

    preferencias.restablecer();

    expect(preferencias.preferencias()).toEqual(PREFERENCIAS_POR_DEFECTO);
    expect(localStorage.getItem(CLAVE_PREFERENCIAS)).toBeNull();
  });

  it('olvidar() no vuelve a escribir: el cierre de sesión ya vació el almacenamiento', () => {
    const preferencias = crear();
    preferencias.setFondo('navy');
    localStorage.clear();

    preferencias.olvidar();

    // Si `olvidar()` persistiera, dejaría un rastro del usuario que se fue.
    expect(preferencias.preferencias()).toEqual(PREFERENCIAS_POR_DEFECTO);
    expect(localStorage.getItem(CLAVE_PREFERENCIAS)).toBeNull();
  });

  it('marcarAnunciosVistos() acumula sin repetir', () => {
    const preferencias = crear();

    preferencias.marcarAnunciosVistos(['a', 'b']);
    preferencias.marcarAnunciosVistos(['b', 'c']);
    preferencias.marcarAnunciosVistos([]);

    expect([...preferencias.anuncios().vistos].sort()).toEqual(['a', 'b', 'c']);
  });

  it('reiniciarAnuncios() borra los leídos y vuelve a habilitarlos', () => {
    const preferencias = crear();
    preferencias.marcarAnunciosVistos(['a']);
    preferencias.setSilenciarAnuncios(true);

    preferencias.reiniciarAnuncios();

    expect(preferencias.anuncios()).toEqual({ vistos: [], silenciar: false });
  });

  it('un JSON corrupto en localStorage no impide arrancar', () => {
    localStorage.setItem(CLAVE_PREFERENCIAS, '{ esto no es json');
    expect(crear().preferencias()).toEqual(PREFERENCIAS_POR_DEFECTO);
  });
});
