import { TestBed } from '@angular/core/testing';
import { AparienciaDomAdaptador } from './apariencia-dom.service';
import { PREFERENCIAS_POR_DEFECTO } from '../interfaces/preferencias.model';
import type { PreferenciasApariencia, PreferenciasEstructura } from '../interfaces/preferencias.model';

/**
 * El único punto donde una preferencia se convierte en píxeles: escribe
 * variables CSS **en línea** sobre `<html>`, que por especificidad le ganan a
 * `tokens.css`. Quitar la variable devuelve el control a la hoja de estilos, y
 * por eso "volver a fábrica" no necesita conocer el valor original.
 */
describe('AparienciaDomAdaptador', () => {
  const raiz = document.documentElement;
  let adaptador: AparienciaDomAdaptador;

  function apariencia(cambio: Partial<PreferenciasApariencia> = {}): PreferenciasApariencia {
    return { ...PREFERENCIAS_POR_DEFECTO.apariencia, ...cambio };
  }

  function estructura(cambio: Partial<PreferenciasEstructura> = {}): PreferenciasEstructura {
    return { ...PREFERENCIAS_POR_DEFECTO.estructura, ...cambio };
  }

  beforeEach(() => {
    raiz.removeAttribute('style');
    raiz.removeAttribute('data-menu');
    raiz.removeAttribute('data-menu-etiquetas');
    TestBed.configureTestingModule({});
    adaptador = TestBed.inject(AparienciaDomAdaptador);
  });

  afterEach(() => {
    raiz.removeAttribute('style');
    raiz.removeAttribute('data-menu');
    raiz.removeAttribute('data-menu-etiquetas');
  });

  it('el acento deriva sus tonos: hover, variante clara, texto encima y anillo de foco', () => {
    adaptador.aplicar(apariencia({ acento: '#00a2ff' }), false);

    const estilo = raiz.style;
    expect(estilo.getPropertyValue('--mis-accent').trim()).toBe('#00a2ff');
    expect(estilo.getPropertyValue('--mis-secondary').trim()).toBe('#00a2ff');
    expect(estilo.getPropertyValue('--mis-secondary-hover').trim()).not.toBe('');
    expect(estilo.getPropertyValue('--mis-secondary-light').trim()).not.toBe('');
    expect(estilo.getPropertyValue('--mis-text-on-secondary').trim()).not.toBe('');
    expect(estilo.getPropertyValue('--mis-shadow-focus')).toContain('rgba(0, 162, 255, 0.35)');
  });

  // En claro el hover oscurece y en oscuro aclara: el mismo acento no puede
  // dar el mismo resultado en los dos temas.
  it('el mismo acento se resuelve distinto en claro que en oscuro', () => {
    adaptador.aplicar(apariencia({ acento: '#00a2ff' }), false);
    const enClaro = raiz.style.getPropertyValue('--mis-secondary-hover');

    adaptador.aplicar(apariencia({ acento: '#00a2ff' }), true);

    expect(raiz.style.getPropertyValue('--mis-secondary-hover')).not.toBe(enClaro);
  });

  it('publica el modo de menú y las etiquetas como atributos de <html>', () => {
    adaptador.aplicarEstructura(estructura({ modoSidebar: 'estatico', etiquetasSidebar: true }));

    expect(raiz.dataset['menu']).toBe('estatico');
    expect(raiz.dataset['menuEtiquetas']).toBe('si');
    // Con etiquetas el ancho lo pone el token, no una variable en línea.
    expect(raiz.style.getPropertyValue('--mis-sidebar-col1-w')).toBe('');
  });

  it('el modo delgado es solo íconos aunque la preferencia pida etiquetas', () => {
    adaptador.aplicarEstructura(estructura({ modoSidebar: 'delgado', etiquetasSidebar: true }));

    expect(raiz.dataset['menuEtiquetas']).toBe('no');
    expect(raiz.style.getPropertyValue('--mis-sidebar-col1-w').trim()).toBe('52px');
  });

  it('sin etiquetas el rail se angosta, y al volver a ponerlas suelta la variable', () => {
    adaptador.aplicarEstructura(estructura({ etiquetasSidebar: false }));
    expect(raiz.style.getPropertyValue('--mis-sidebar-col1-w').trim()).toBe('52px');

    adaptador.aplicarEstructura(estructura({ etiquetasSidebar: true }));
    expect(raiz.style.getPropertyValue('--mis-sidebar-col1-w')).toBe('');
  });
});
