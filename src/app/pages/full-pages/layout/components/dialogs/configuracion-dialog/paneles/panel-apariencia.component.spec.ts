import { TestBed } from '@angular/core/testing';
import { PanelAparienciaComponent } from './panel-apariencia.component';
import { PreferenciasService } from '../../../../../../../core/preferencias/aplicacion/preferencias.service';
import { REPOSITORIO_PREFERENCIAS } from '../../../../../../../core/preferencias/dominio/repositorio-preferencias.puerto';
import { PreferenciasLocalStorageRepositorio } from '../../../../../../../core/preferencias/infraestructura/preferencias-local-storage.repositorio';
import { CATALOGO_FONDOS, FONDO_PERSONALIZADO } from '../../../../../../../core/preferencias/dominio/preferencias.model';

/** La pantalla de Apariencia es el pedido central: elegir el fondo (y su color). */
describe('PanelAparienciaComponent', () => {
  function crear() {
    TestBed.configureTestingModule({
      imports: [PanelAparienciaComponent],
      providers: [{ provide: REPOSITORIO_PREFERENCIAS, useExisting: PreferenciasLocalStorageRepositorio }],
    });
    const fixture = TestBed.createComponent(PanelAparienciaComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('style');
    window.matchMedia = ((consulta: string) => ({
      matches: false,
      media: consulta,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('style');
  });

  it('ofrece todo el catálogo de fondos y marca el activo', () => {
    const fixture = crear();
    const el = fixture.nativeElement as HTMLElement;

    const botones = el.querySelectorAll('.mis-fondo');
    expect(botones).toHaveLength(CATALOGO_FONDOS.length);

    const activos = el.querySelectorAll('.mis-fondo--activo');
    expect(activos).toHaveLength(1);
    expect(activos[0].textContent).toContain('Foto institucional');
  });

  it('elegir un fondo lo guarda como preferencia', () => {
    const fixture = crear();
    const el = fixture.nativeElement as HTMLElement;
    const indiceNavy = CATALOGO_FONDOS.findIndex((f) => f.clave === 'navy');

    (el.querySelectorAll('.mis-fondo')[indiceNavy] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(TestBed.inject(PreferenciasService).apariencia().fondo).toBe('navy');
    expect(el.querySelectorAll('.mis-fondo--activo')[0].textContent).toContain('Navy');
  });

  it('elegir un color a mano cambia también al fondo personalizado', () => {
    const fixture = crear();
    const preferencias = TestBed.inject(PreferenciasService);

    (fixture.componentInstance as unknown as { elegirColorFondo(c: string): void }).elegirColorFondo('#123456');
    fixture.detectChanges();

    // Sin el cambio de fondo, el color elegido quedaría guardado pero invisible.
    expect(preferencias.apariencia().colorFondo).toBe('#123456');
    expect(preferencias.apariencia().fondo).toBe(FONDO_PERSONALIZADO);
  });

  it('elegir un acento lo guarda', () => {
    const fixture = crear();
    const el = fixture.nativeElement as HTMLElement;

    (el.querySelectorAll('.mis-acento')[3] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(el.querySelectorAll('.mis-acento--activo')).toHaveLength(1);
    expect(TestBed.inject(PreferenciasService).apariencia().acento).not.toBe('#00a2ff');
  });
});
