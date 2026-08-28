import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { ExploradorSistemaComponent } from './explorador-sistema.component';
import { NavegacionSistemasService } from '../../services/navegacion-sistemas.service';
import { ShellStateService } from '../../../../../core/services/shell-state.service';

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

  it('debe persistir el modo lista en localStorage al cambiar de vista', () => {
    const fixture = TestBed.createComponent(ExploradorSistemaComponent);
    const component = fixture.componentInstance as any;

    component.cambiarVista('lista');
    expect(component.vista()).toBe('lista');
    expect(localStorage.getItem('mis-explorador-vista')).toBe('lista');
  });

  it('debe restaurar la vista desde localStorage al volver a instanciarse', () => {
    localStorage.setItem('mis-explorador-vista', 'lista');
    const fixture = TestBed.createComponent(ExploradorSistemaComponent);
    const component = fixture.componentInstance as any;
    expect(component.vista()).toBe('lista');
  });
});
