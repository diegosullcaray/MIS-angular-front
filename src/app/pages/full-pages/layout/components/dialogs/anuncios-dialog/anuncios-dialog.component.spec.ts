import { TestBed } from '@angular/core/testing';
import { AnunciosDialogComponent } from './anuncios-dialog.component';
import { AnunciosService } from '../../../services/anuncios.service';
import { PreferenciasService } from '../../../services/preferencias.service';
import { CATALOGO_ANUNCIOS } from '../../../interfaces/anuncio.model';
import { REPOSITORIO_PREFERENCIAS } from '../../../interfaces/preferencias-almacen.model';
import { PreferenciasLocalStorageRepositorio } from '../../../services/preferencias-local-storage.service';
import type { Anuncio } from '../../../interfaces/anuncio.model';

/** Comunicado de una sola pieza: la forma histórica, sin recorrido. */
const CATALOGO_SIMPLE: readonly Anuncio[] = [
  {
    id: 'vinculacion-cartera-captaciones',
    imagen: 'assets/images/fc/ads/Comunicado.png',
    alt: 'Nuevos paneles: Vinculación de Cartera - Captaciones.',
    ancho: 780,
    alto: 815,
  },
];

/** Comunicado de varias piezas: el diálogo lo recorre como carrusel. */
const CATALOGO_CARRUSEL: readonly Anuncio[] = [
  {
    id: 'campania-multiple',
    laminas: [
      { imagen: 'assets/images/fc/ads/pieza-1.png', alt: 'Primera lámina', ancho: 780, alto: 815 },
      { imagen: 'assets/images/fc/ads/pieza-2.png', alt: 'Segunda lámina', ancho: 780, alto: 815 },
      { imagen: 'assets/images/fc/ads/pieza-3.png', alt: 'Tercera lámina', ancho: 780, alto: 815 },
    ],
  },
];

describe('AnunciosDialogComponent', () => {
  function crear(catalogo: readonly Anuncio[] = CATALOGO_SIMPLE) {
    TestBed.configureTestingModule({
      imports: [AnunciosDialogComponent],
      providers: [
        { provide: REPOSITORIO_PREFERENCIAS, useExisting: PreferenciasLocalStorageRepositorio },
        { provide: CATALOGO_ANUNCIOS, useValue: catalogo },
      ],
    });
    return TestBed.createComponent(AnunciosDialogComponent);
  }

  // `p-dialog` con `appendTo="body"`: el contenido no vive en el fixture.
  function imagenes(): HTMLImageElement[] {
    return Array.from(document.body.querySelectorAll<HTMLImageElement>('img.mis-anuncio-imagen'));
  }

  function puntos(): HTMLButtonElement[] {
    return Array.from(document.body.querySelectorAll<HTMLButtonElement>('button.mis-anuncio-punto'));
  }

  function flecha(nombre: 'Lámina anterior' | 'Lámina siguiente'): HTMLElement | null {
    return document.body.querySelector<HTMLElement>(`[aria-label="${nombre}"]`);
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
  });
  afterEach(() => localStorage.clear());

  it('no pinta nada mientras el servicio no lo abra', () => {
    const fixture = crear();
    fixture.detectChanges();

    expect(imagenes()).toHaveLength(0);
  });

  describe('comunicado de una sola pieza', () => {
    it('muestra la imagen con su alt y sus medidas reales', () => {
      const fixture = crear();
      TestBed.inject(AnunciosService).abrirSiCorresponde();
      fixture.detectChanges();

      const [img, ...resto] = imagenes();
      expect(resto).toHaveLength(0);
      expect(img.getAttribute('src')).toBe('assets/images/fc/ads/Comunicado.png');
      expect(img.getAttribute('alt')).toContain('Vinculación de Cartera');
      // Sin `width`/`height` el diálogo salta de tamaño cuando la imagen carga.
      expect(img.getAttribute('width')).toBe('780');
      expect(img.getAttribute('height')).toBe('815');
    });

    it('NO muestra controles de recorrido: no hay nada que recorrer', () => {
      const fixture = crear();
      TestBed.inject(AnunciosService).abrirSiCorresponde();
      fixture.detectChanges();

      expect(puntos()).toHaveLength(0);
      expect(flecha('Lámina siguiente')).toBeNull();
      expect(flecha('Lámina anterior')).toBeNull();
      expect(document.body.textContent).not.toContain('Lámina 1 de');
    });
  });

  describe('comunicado de varias piezas', () => {
    function abrirCarrusel() {
      const fixture = crear(CATALOGO_CARRUSEL);
      TestBed.inject(AnunciosService).abrirSiCorresponde();
      fixture.detectChanges();
      return { fixture, componente: fixture.componentInstance as unknown as Carrusel };
    }

    interface Carrusel {
      siguiente(): void;
      anterior(): void;
      irA(indice: number): void;
      onTecla(evento: KeyboardEvent): void;
    }

    it('muestra una lámina a la vez, empezando por la primera', () => {
      const { fixture } = abrirCarrusel();

      expect(imagenes()).toHaveLength(1);
      expect(imagenes()[0].getAttribute('alt')).toBe('Primera lámina');
      expect(document.body.textContent).toContain('Lámina 1 de 3');
      void fixture;
    });

    it('ofrece un indicador por lámina y marca el activo', () => {
      abrirCarrusel();

      expect(puntos()).toHaveLength(3);
      expect(puntos()[0].getAttribute('aria-current')).toBe('true');
      expect(puntos()[1].getAttribute('aria-current')).toBeNull();
      expect(puntos()[0].getAttribute('aria-label')).toBe('Lámina 1 de 3');
    });

    it('avanza y retrocede entre láminas', () => {
      const { fixture, componente } = abrirCarrusel();

      componente.siguiente();
      fixture.detectChanges();
      expect(imagenes()[0].getAttribute('alt')).toBe('Segunda lámina');

      componente.anterior();
      fixture.detectChanges();
      expect(imagenes()[0].getAttribute('alt')).toBe('Primera lámina');
    });

    it('el recorrido es circular en las dos direcciones', () => {
      const { fixture, componente } = abrirCarrusel();

      // Desde la primera, "anterior" lleva a la última.
      componente.anterior();
      fixture.detectChanges();
      expect(imagenes()[0].getAttribute('alt')).toBe('Tercera lámina');

      // Y desde la última, "siguiente" vuelve a la primera.
      componente.siguiente();
      fixture.detectChanges();
      expect(imagenes()[0].getAttribute('alt')).toBe('Primera lámina');
    });

    it('un indicador salta directo a su lámina', () => {
      const { fixture, componente } = abrirCarrusel();

      componente.irA(2);
      fixture.detectChanges();

      expect(imagenes()[0].getAttribute('alt')).toBe('Tercera lámina');
      expect(puntos()[2].getAttribute('aria-current')).toBe('true');
    });

    it('las flechas del teclado recorren las láminas', () => {
      const { fixture, componente } = abrirCarrusel();

      componente.onTecla(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      fixture.detectChanges();
      expect(imagenes()[0].getAttribute('alt')).toBe('Segunda lámina');

      componente.onTecla(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
      fixture.detectChanges();
      expect(imagenes()[0].getAttribute('alt')).toBe('Primera lámina');
    });

    it('otras teclas no mueven el carrusel', () => {
      const { fixture, componente } = abrirCarrusel();

      componente.onTecla(new KeyboardEvent('keydown', { key: 'a' }));
      fixture.detectChanges();

      expect(imagenes()[0].getAttribute('alt')).toBe('Primera lámina');
    });

    it('reabrirlo vuelve a empezar por la primera lámina', () => {
      const { fixture, componente } = abrirCarrusel();
      const anuncios = TestBed.inject(AnunciosService);

      componente.irA(2);
      fixture.detectChanges();
      expect(imagenes()[0].getAttribute('alt')).toBe('Tercera lámina');

      anuncios.cerrar();
      fixture.detectChanges();
      anuncios.abrir();
      fixture.detectChanges();

      // Sin esto, quien cerró en la lámina 3 la reabre ahí y se pierde el principio.
      expect(imagenes()[0].getAttribute('alt')).toBe('Primera lámina');
    });

    it('cerrarlo marca el comunicado completo como leído, no una lámina', () => {
      const { fixture, componente } = abrirCarrusel();
      const anuncios = TestBed.inject(AnunciosService);

      componente.irA(1);
      anuncios.cerrar();
      fixture.detectChanges();

      expect(anuncios.abierto()).toBe(false);
      expect(TestBed.inject(PreferenciasService).anuncios().vistos).toEqual(['campania-multiple']);
    });
  });

  it('cerrarlo deja el comunicado marcado como leído', () => {
    const fixture = crear();
    const anuncios = TestBed.inject(AnunciosService);
    anuncios.abrirSiCorresponde();
    fixture.detectChanges();

    (fixture.componentInstance as unknown as { cerrar(): void }).cerrar();
    fixture.detectChanges();

    expect(anuncios.abierto()).toBe(false);
    expect(TestBed.inject(PreferenciasService).anuncios().vistos).toEqual(['vinculacion-cartera-captaciones']);
  });

  it('abierto a pedido con el comunicado ya leído, muestra la pieza y nada más', () => {
    const fixture = crear();
    const anuncios = TestBed.inject(AnunciosService);
    anuncios.abrirSiCorresponde();
    anuncios.cerrar();

    anuncios.abrir();
    fixture.detectChanges();

    // Releerlo no cambia lo que se ve: la pieza sola, sin avisos de estado.
    expect(document.body.textContent).not.toContain('Ya leíste');
    expect(imagenes()).toHaveLength(1);
  });
});
