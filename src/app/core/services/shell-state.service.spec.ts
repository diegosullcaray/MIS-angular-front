import { TestBed } from '@angular/core/testing';
import { ShellStateService } from './shell-state.service';
import type { UsuarioActivo } from '../interfaces/shell-state.model';

function usuario(overrides: Partial<UsuarioActivo> = {}): UsuarioActivo {
  return {
    id: 'u-1',
    nombre: 'Ana Torres',
    email: 'ana.torres@confianza.pe',
    rol: 'admin-sistema',
    subsistemas: ['subsistema-reportes'],
    ...overrides,
  };
}

describe('ShellStateService', () => {
  let service: ShellStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShellStateService);
  });

  it('empieza sin usuario activo', () => {
    expect(service.usuarioActivo()).toBeNull();
    expect(service.esAdmin()).toBe(false);
    expect(service.esAdminSistema()).toBe(false);
    expect(service.subsistemas()).toEqual([]);
  });

  it('esAdminSistema es true solo para el rol admin-sistema', () => {
    service.setUsuarioActivo(usuario({ rol: 'admin-sistema' }));
    expect(service.esAdminSistema()).toBe(true);

    service.setUsuarioActivo(usuario({ rol: 'admin-general' }));
    expect(service.esAdminSistema()).toBe(false);
  });

  it('esAdmin es true para admin-sistema y admin-general, no para supervisor-area', () => {
    service.setUsuarioActivo(usuario({ rol: 'admin-general' }));
    expect(service.esAdmin()).toBe(true);

    service.setUsuarioActivo(usuario({ rol: 'supervisor-area' }));
    expect(service.esAdmin()).toBe(false);
  });

  it('subsistemas refleja los del usuario activo', () => {
    service.setUsuarioActivo(usuario({ subsistemas: ['subsistema-rrhh', 'subsistema-ventas'] }));
    expect(service.subsistemas()).toEqual(['subsistema-rrhh', 'subsistema-ventas']);
  });

  it('inicialesUsuario toma las primeras 2 iniciales del nombre', () => {
    service.setUsuarioActivo(usuario({ nombre: 'Ana María Torres' }));
    expect(service.inicialesUsuario()).toBe('AM');
  });

  it('cerrarSesion limpia usuario y menú activo', () => {
    service.setUsuarioActivo(usuario());
    service.setMenuItemActivo({ ruta: '/app/ranking-k', etiqueta: 'Sistemas' });

    service.cerrarSesion();

    expect(service.usuarioActivo()).toBeNull();
    expect(service.menuItemActivo()).toBeNull();
    expect(service.esAdmin()).toBe(false);
  });

  it('navPanelColapsado empieza en false y toggleNavPanel() lo alterna', () => {
    expect(service.navPanelColapsado()).toBe(false);

    service.toggleNavPanel();
    expect(service.navPanelColapsado()).toBe(true);

    service.toggleNavPanel();
    expect(service.navPanelColapsado()).toBe(false);
  });

  it('setNavPanelColapsado() fuerza el valor sin importar el estado previo', () => {
    service.setNavPanelColapsado(true);
    expect(service.navPanelColapsado()).toBe(true);

    service.setNavPanelColapsado(true); // repetir el mismo valor no debe alternar
    expect(service.navPanelColapsado()).toBe(true);

    service.setNavPanelColapsado(false);
    expect(service.navPanelColapsado()).toBe(false);
  });
});
