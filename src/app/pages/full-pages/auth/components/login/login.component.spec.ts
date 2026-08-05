import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { LoginComponent } from './login.component';
import { AuthService } from '../../service/auth.service';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import type { UsuarioActivo } from '../../../../../core/interfaces/shell-state.model';

function usuario(): UsuarioActivo {
  return {
    id: 'u-1',
    nombre: 'Ana Torres',
    email: 'ana.torres@confianza.pe',
    rol: 'admin-sistema',
    subsistemas: [],
  };
}

describe('LoginComponent', () => {
  let authFalso: { completarLoginGoogle: ReturnType<typeof vi.fn>; iniciarLoginGoogle: ReturnType<typeof vi.fn> };
  let shell: ShellStateService;
  let router: Router;

  beforeEach(() => {
    authFalso = { completarLoginGoogle: vi.fn(), iniciarLoginGoogle: vi.fn() };

    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), MessageService, { provide: AuthService, useValue: authFalso }],
    });
    shell = TestBed.inject(ShellStateService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('muestra "Verificando tu sesión…" mientras completarLoginGoogle() está pendiente', () => {
    authFalso.completarLoginGoogle.mockReturnValue(new Promise(() => {})); // nunca resuelve
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance['paso']()).toBe('verificando');
  });

  it('sin sesión de Google, pasa a "inicial" y muestra el botón de acceso', async () => {
    authFalso.completarLoginGoogle.mockResolvedValue(null);
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance['paso']()).toBe('inicial');
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Continuar con Google');
  });

  it('onGoogleLogin() delega en AuthService.iniciarLoginGoogle()', async () => {
    authFalso.completarLoginGoogle.mockResolvedValue(null);
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance['onGoogleLogin']();

    expect(authFalso.iniciarLoginGoogle).toHaveBeenCalled();
  });

  it('con sesión de Google válida, marca "host-inicio" activo y navega a /app/dashboard tras el spinner branded', async () => {
    vi.useFakeTimers();
    authFalso.completarLoginGoogle.mockResolvedValue(usuario());
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    await vi.advanceTimersByTimeAsync(0); // deja resolver completarLoginGoogle()
    expect(shell.sidebarIconActivo()).toBe('host-inicio');
    expect(fixture.componentInstance['paso']()).toBe('cargando');
    expect(navSpy).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(5000);
    expect(navSpy).toHaveBeenCalledWith(['/app/dashboard']);
  });

  it('si completarLoginGoogle() rechaza, muestra un toast de error y pasa a "inicial"', async () => {
    authFalso.completarLoginGoogle.mockRejectedValue(new Error('Token de Google inválido.'));
    const toast = TestBed.inject(ToastService);
    const toastSpy = vi.spyOn(toast, 'error');

    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(toastSpy).toHaveBeenCalledWith('No se pudo iniciar sesión', 'Token de Google inválido.');
    expect(fixture.componentInstance['paso']()).toBe('inicial');
  });
});
