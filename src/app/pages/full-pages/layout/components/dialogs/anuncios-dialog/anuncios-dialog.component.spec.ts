import { TestBed } from '@angular/core/testing';
import { AnunciosDialogComponent } from './anuncios-dialog.component';
import { AnunciosService } from '../../../../../../core/preferencias/aplicacion/anuncios.service';
import { PreferenciasService } from '../../../../../../core/preferencias/aplicacion/preferencias.service';
import { CATALOGO_ANUNCIOS } from '../../../../../../core/preferencias/dominio/anuncios.puerto';
import { REPOSITORIO_PREFERENCIAS } from '../../../../../../core/preferencias/dominio/repositorio-preferencias.puerto';
import { PreferenciasLocalStorageRepositorio } from '../../../../../../core/preferencias/infraestructura/preferencias-local-storage.repositorio';
import type { Anuncio } from '../../../../../../core/preferencias/dominio/anuncio.model';

const CATALOGO: readonly Anuncio[] = [
  { id: 'uno', titulo: 'Nueva configuración de diseño', cuerpo: 'Podés elegir el fondo.', severidad: 'novedad', fecha: '2026-08-02' },
  { id: 'dos', titulo: 'Ventana de mantenimiento', cuerpo: 'Sábado de 2 a 4.', severidad: 'mantenimiento', fecha: '2026-08-01' },
];

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

  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('no pinta nada mientras el servicio no lo abra', () => {
    const fixture = crear();
    fixture.detectChanges();

    // `p-dialog` con `appendTo="body"`: el contenido no vive en el fixture.
    expect(document.body.textContent).not.toContain('Nueva configuración de diseño');
  });

  it('muestra los anuncios pendientes cuando se abre', () => {
    const fixture = crear();
    TestBed.inject(AnunciosService).abrirSiCorresponde();
    fixture.detectChanges();

    expect(document.body.textContent).toContain('Nueva configuración de diseño');
    expect(document.body.textContent).toContain('Ventana de mantenimiento');
  });

  it('cerrarlo deja marcados como leídos los anuncios que mostró', () => {
    const fixture = crear();
    const anuncios = TestBed.inject(AnunciosService);
    anuncios.abrirSiCorresponde();
    fixture.detectChanges();

    (fixture.componentInstance as unknown as { cerrar(): void }).cerrar();
    fixture.detectChanges();

    expect(anuncios.abierto()).toBe(false);
    expect([...TestBed.inject(PreferenciasService).anuncios().vistos].sort()).toEqual(['dos', 'uno']);
  });

  it('abierto a pedido sin novedades, muestra el historial y lo dice', () => {
    const fixture = crear();
    const anuncios = TestBed.inject(AnunciosService);
    anuncios.abrirSiCorresponde();
    anuncios.cerrar();

    anuncios.abrir();
    fixture.detectChanges();

    expect(document.body.textContent).toContain('No hay novedades sin leer');
    expect(document.body.textContent).toContain('Nueva configuración de diseño');
  });
});
