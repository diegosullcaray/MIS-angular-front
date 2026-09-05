import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { ExploradorSistemaComponent } from './explorador-sistema.component';
import { NavegacionSistemasService } from '../../services/navegacion-sistemas.service';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { PreferenciasService } from '../../../../../core/preferencias/aplicacion/preferencias.service';
import { REPOSITORIO_PREFERENCIAS } from '../../../../../core/preferencias/dominio/repositorio-preferencias.puerto';
import { PreferenciasLocalStorageRepositorio } from '../../../../../core/preferencias/infraestructura/preferencias-local-storage.repositorio';

/**
 * La vista del explorador dejó de guardarse en una clave propia
 * (`mis-explorador-vista`) y pasó a ser una preferencia más: se elige acá o en
 * Configuración → Estructura, y las dos escriben en el mismo lugar. Eso es lo
 * que hace que el borrado de sesión sea uno solo.
 */
describe('ExploradorSistemaComponent', () => {
  let mockNavegacion: Partial<NavegacionSistemasService>;
  let mockShell: Partial<ShellStateService>;
  let mockRouter: Partial<Router>;

  beforeEach(() => {
    localStorage.clear();
    mockNavegacion = {
      panelActivo: signal(null),
      nodosActuales: signal([]),
      entrarCarpeta: vi.fn(),
    } as any;
    mockShell = {
      setMenuItemActivo: vi.fn(),
      setContenidoPendienteSeleccion: vi.fn(),
    };
    mockRouter = {
      navigateByUrl: vi.fn().mockResolvedValue(true),
    };

    TestBed.configureTestingModule({
      imports: [ExploradorSistemaComponent],
      providers: [
        { provide: NavegacionSistemasService, useValue: mockNavegacion },
        { provide: ShellStateService, useValue: mockShell },
        { provide: Router, useValue: mockRouter },
        // El adaptador real: estos tests verifican justamente que la vista
        // sobreviva en `localStorage`, no el repositorio en memoria del token.
        { provide: REPOSITORIO_PREFERENCIAS, useExisting: PreferenciasLocalStorageRepositorio },
      ],
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('debe inicializarse en cuadrícula por defecto si no hay nada guardado', () => {
    const fixture = TestBed.createComponent(ExploradorSistemaComponent);
    const component = fixture.componentInstance as any;
    expect(component.vista()).toBe('cuadricula');
  });

  it('cambiar de vista queda guardado como preferencia, no en una clave propia', () => {
    const fixture = TestBed.createComponent(ExploradorSistemaComponent);
    const component = fixture.componentInstance as any;

    component.cambiarVista('lista');

    expect(component.vista()).toBe('lista');
    expect(TestBed.inject(PreferenciasService).estructura().vistaExplorador).toBe('lista');
    expect(localStorage.getItem('mis.preferencias')).toContain('"vistaExplorador":"lista"');
    // La clave suelta de antes ya no se usa: si sobreviviera, el borrado de
    // sesión tendría que conocerla una por una.
    expect(localStorage.getItem('mis-explorador-vista')).toBeNull();
  });

  it('debe restaurar la vista guardada al volver a instanciarse', () => {
    TestBed.inject(PreferenciasService).setVistaExplorador('lista');
    TestBed.resetTestingModule();

    TestBed.configureTestingModule({
      imports: [ExploradorSistemaComponent],
      providers: [
        { provide: NavegacionSistemasService, useValue: mockNavegacion },
        { provide: ShellStateService, useValue: mockShell },
        { provide: Router, useValue: mockRouter },
        { provide: REPOSITORIO_PREFERENCIAS, useExisting: PreferenciasLocalStorageRepositorio },
      ],
    });

    const component = TestBed.createComponent(ExploradorSistemaComponent).componentInstance as any;
    expect(component.vista()).toBe('lista');
  });
});
