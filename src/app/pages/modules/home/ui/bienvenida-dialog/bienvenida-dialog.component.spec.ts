import { TestBed } from '@angular/core/testing';
import { BienvenidaDialogComponent } from './bienvenida-dialog.component';
import { NovedadesTourService } from '../../services/novedades-tour.service';
import { DriverTourService } from '../../../../../shared/services/driver-tour.service';
import { PreferenciasService } from '../../../../full-pages/layout/services/preferencias.service';
import { REPOSITORIO_PREFERENCIAS } from '../../../../full-pages/layout/interfaces/preferencias-almacen.model';
import { PreferenciasLocalStorageRepositorio } from '../../../../full-pages/layout/services/preferencias-local-storage.service';

describe('BienvenidaDialogComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [BienvenidaDialogComponent],
      providers: [
        { provide: DriverTourService, useValue: { createQuickTour: vi.fn() } },
        { provide: REPOSITORIO_PREFERENCIAS, useExisting: PreferenciasLocalStorageRepositorio },
      ],
    });
  });

  afterEach(() => localStorage.clear());

  function crear() {
    const fixture = TestBed.createComponent(BienvenidaDialogComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('se abre sola la primera vez', () => {
    expect(crear().componentInstance.abierto()).toBe(true);
  });

  it('cerrarla la da por vista y no vuelve a abrirse', () => {
    const fixture = crear();

    (fixture.componentInstance as unknown as { cerrar(): void }).cerrar();

    expect(fixture.componentInstance.abierto()).toBe(false);
    expect(TestBed.inject(PreferenciasService).bienvenida().vista).toBe(true);

    // Otro arranque, con la preferencia ya guardada.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [BienvenidaDialogComponent],
      providers: [
        { provide: DriverTourService, useValue: { createQuickTour: vi.fn() } },
        { provide: REPOSITORIO_PREFERENCIAS, useExisting: PreferenciasLocalStorageRepositorio },
      ],
    });
    expect(crear().componentInstance.abierto()).toBe(false);
  });

  it('nombra a Pachi y lista novedades del mismo catálogo, sin duplicarlas', () => {
    const fixture = crear();
    const servicio = TestBed.inject(NovedadesTourService);

    expect(document.body.textContent).toContain('Pachi');
    expect(document.body.textContent).toContain(servicio.novedades[0].titulo);
  });

  it('"Ver las novedades" cierra la bienvenida y avisa al Home', () => {
    const fixture = crear();
    const pedido = vi.fn();
    fixture.componentInstance.verNovedades.subscribe(pedido);

    (fixture.componentInstance as unknown as { irANovedades(): void }).irANovedades();

    expect(pedido).toHaveBeenCalled();
    expect(fixture.componentInstance.abierto()).toBe(false);
    expect(TestBed.inject(PreferenciasService).bienvenida().vista).toBe(true);
  });
});
