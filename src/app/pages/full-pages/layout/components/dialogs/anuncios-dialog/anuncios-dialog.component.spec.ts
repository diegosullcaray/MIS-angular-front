import { TestBed } from '@angular/core/testing';
import { AnunciosDialogComponent } from './anuncios-dialog.component';
import { AnunciosService } from '../../../../../../core/preferencias/aplicacion/anuncios.service';
import { PreferenciasService } from '../../../../../../core/preferencias/aplicacion/preferencias.service';
import { CATALOGO_ANUNCIOS } from '../../../../../../core/preferencias/dominio/anuncios.puerto';
import { REPOSITORIO_PREFERENCIAS } from '../../../../../../core/preferencias/dominio/repositorio-preferencias.puerto';
import { PreferenciasLocalStorageRepositorio } from '../../../../../../core/preferencias/infraestructura/preferencias-local-storage.repositorio';
import type { Anuncio } from '../../../../../../core/preferencias/dominio/anuncio.model';

const CATALOGO: readonly Anuncio[] = [
  {
    id: 'vinculacion-cartera-captaciones',
    imagen: 'assets/images/fc/ads/Comunicado.png',
    alt: 'Nuevos paneles: Vinculación de Cartera - Captaciones.',
    ancho: 780,
    alto: 815,
  },
];

/** El comunicado ES una imagen, y hay una sola: no hay título, cuerpo ni recorrido. */
describe('AnunciosDialogComponent', () => {
  function crear() {
    TestBed.configureTestingModule({
      imports: [AnunciosDialogComponent],
      providers: [
        { provide: REPOSITORIO_PREFERENCIAS, useExisting: PreferenciasLocalStorageRepositorio },
        { provide: CATALOGO_ANUNCIOS, useValue: CATALOGO },
      ],
    });
    return TestBed.createComponent(AnunciosDialogComponent);
  }

  function imagenes(): HTMLImageElement[] {
    // `p-dialog` con `appendTo="body"`: el contenido no vive en el fixture.
    return Array.from(document.body.querySelectorAll<HTMLImageElement>('img.mis-anuncio-imagen'));
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('no pinta nada mientras el servicio no lo abra', () => {
    const fixture = crear();
    fixture.detectChanges();

    expect(imagenes()).toHaveLength(0);
  });

  it('muestra UNA sola imagen, con su alt y sus medidas reales', () => {
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

  it('abierto a pedido con el comunicado ya leído, lo dice y lo sigue mostrando', () => {
    const fixture = crear();
    const anuncios = TestBed.inject(AnunciosService);
    anuncios.abrirSiCorresponde();
    anuncios.cerrar();

    anuncios.abrir();
    fixture.detectChanges();

    expect(document.body.textContent).toContain('Ya leíste este comunicado');
    expect(imagenes()).toHaveLength(1);
  });
});
