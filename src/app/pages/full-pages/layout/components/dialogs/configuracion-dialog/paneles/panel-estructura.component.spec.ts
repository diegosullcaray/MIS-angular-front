import { TestBed } from '@angular/core/testing';
import { PanelEstructuraComponent } from './panel-estructura.component';
import { PreferenciasService } from '../../../../../../../core/preferencias/aplicacion/preferencias.service';
import { REPOSITORIO_PREFERENCIAS } from '../../../../../../../core/preferencias/dominio/repositorio-preferencias.puerto';
import { PreferenciasLocalStorageRepositorio } from '../../../../../../../core/preferencias/infraestructura/preferencias-local-storage.repositorio';
import { CATALOGO_MODOS_SIDEBAR } from '../../../../../../../core/preferencias/dominio/preferencias.model';

/**
 * Estructura del menú: los cuatro modos son los mismos que ofrece el layout de
 * PrimeNG (static / slim / overlay / horizontal).
 */
describe('PanelEstructuraComponent', () => {
  function crear() {
    TestBed.configureTestingModule({
      imports: [PanelEstructuraComponent],
      providers: [{ provide: REPOSITORIO_PREFERENCIAS, useExisting: PreferenciasLocalStorageRepositorio }],
    });
    const fixture = TestBed.createComponent(PanelEstructuraComponent);
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

  afterEach(() => localStorage.clear());

  it('ofrece los cuatro modos y arranca con el estático marcado', () => {
    const el = crear().nativeElement as HTMLElement;

    expect(el.querySelectorAll('.mis-modo')).toHaveLength(CATALOGO_MODOS_SIDEBAR.length);
    expect(el.querySelectorAll('.mis-modo--activo')[0].textContent).toContain('Estático');
  });

  it('elegir un modo lo guarda y lo publica en el <html>', () => {
    const fixture = crear();
    const el = fixture.nativeElement as HTMLElement;
    const indice = CATALOGO_MODOS_SIDEBAR.findIndex((m) => m.clave === 'superpuesto');

    (el.querySelectorAll('.mis-modo')[indice] as HTMLButtonElement).click();
    TestBed.tick();
    fixture.detectChanges();

    expect(TestBed.inject(PreferenciasService).estructura().modoSidebar).toBe('superpuesto');
    expect(document.documentElement.dataset['menu']).toBe('superpuesto');
  });

  it('en modo delgado el interruptor de etiquetas queda bloqueado: ese modo es solo íconos', () => {
    const fixture = crear();
    const el = fixture.nativeElement as HTMLElement;
    const indice = CATALOGO_MODOS_SIDEBAR.findIndex((m) => m.clave === 'delgado');

    (el.querySelectorAll('.mis-modo')[indice] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(el.querySelector('.mis-panel-fila--apagada')).not.toBeNull();
    expect(el.textContent).toContain('El modo delgado muestra solo los íconos');
  });
});
