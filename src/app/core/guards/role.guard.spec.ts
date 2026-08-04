import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { MessageService } from 'primeng/api';
import { roleGuard } from './role.guard';
import { ShellStateService } from '../services/shell-state.service';
import type { UsuarioActivo } from '../interfaces/shell-state.model';
import { ToastService } from '../../shared/services/toast.service';
import type { RolSlug } from '../interfaces/rol.model';

function usuario(rol: RolSlug): UsuarioActivo {
  return {
    id: 'u-1',
    nombre: 'Ana Torres',
    email: 'ana.torres@confianza.pe',
    rol,
    subsistemas: [],
  };
}

describe('roleGuard', () => {
  let shell: ShellStateService;
  let router: Router;
  let toast: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), MessageService],
    });
    shell = TestBed.inject(ShellStateService);
    router = TestBed.inject(Router);
    toast = TestBed.inject(ToastService);
  });

  function ejecutarGuard(rolRequerido: RolSlug) {
    return TestBed.runInInjectionContext(() => roleGuard(rolRequerido)({} as any, {} as any));
  }

  it('redirige a /login si no hay usuario activo', () => {
    const resultado = ejecutarGuard('admin-sistema') as UrlTree;
    expect(router.serializeUrl(resultado)).toBe('/login');
  });

  it('permite el acceso cuando el rol coincide exactamente', () => {
    shell.setUsuarioActivo(usuario('admin-sistema'));
    expect(ejecutarGuard('admin-sistema')).toBe(true);
  });

  // Jerarquía: admin-sistema > admin-general > supervisor-area.
  // Un rol más permisivo debe poder entrar a una ruta que exige un rol menos permisivo.
  it('permite el acceso cuando el rol del usuario es más permisivo que el requerido', () => {
    shell.setUsuarioActivo(usuario('admin-sistema'));
    expect(ejecutarGuard('supervisor-area')).toBe(true);
  });

  it('deniega el acceso cuando el rol del usuario es menos permisivo que el requerido', () => {
    shell.setUsuarioActivo(usuario('supervisor-area'));

    const resultado = ejecutarGuard('admin-sistema') as UrlTree;

    expect(router.serializeUrl(resultado)).toBe('/admin/dashboard');
  });

  it('emite un toast de advertencia al denegar el acceso', () => {
    shell.setUsuarioActivo(usuario('supervisor-area'));
    const spy = vi.spyOn(toast, 'advertencia');

    ejecutarGuard('admin-sistema');

    expect(spy).toHaveBeenCalledWith('Acceso denegado', expect.any(String));
  });

  it('no acumula permisos entre usuarios: cambiar de usuario respeta el nuevo rol', () => {
    // Regresión directa de H-03 del sistema anterior: routesArray nunca se
    // reiniciaba y los permisos de un usuario se sumaban a los del siguiente.
    shell.setUsuarioActivo(usuario('admin-sistema'));
    expect(ejecutarGuard('admin-sistema')).toBe(true);

    shell.setUsuarioActivo(usuario('supervisor-area'));
    const resultado = ejecutarGuard('admin-sistema') as UrlTree;
    expect(resultado).not.toBe(true);
    expect(router.serializeUrl(resultado)).toBe('/admin/dashboard');
  });
});
