import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { authGuard } from './auth.guard';
import { ShellStateService } from '../services/shell-state.service';
import type { UsuarioActivo } from '../interfaces/shell-state.model';

describe('authGuard', () => {
  let shell: ShellStateService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    shell = TestBed.inject(ShellStateService);
    router = TestBed.inject(Router);
  });

  function ejecutarGuard() {
    return TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
  }

  it('permite el acceso si hay un usuario activo', () => {
    shell.setUsuarioActivo({
      id: 'u-1',
      nombre: 'Ana Torres',
      email: 'ana.torres@confianza.pe',
      rol: 'admin-sistema',
      subsistemas: [],
    } as UsuarioActivo);

    expect(ejecutarGuard()).toBe(true);
  });

  it('redirige a /login si no hay sesión', () => {
    const resultado = ejecutarGuard();

    expect(resultado).not.toBe(true);
    const urlTree = resultado as UrlTree;
    expect(router.serializeUrl(urlTree)).toBe('/login');
  });
});
