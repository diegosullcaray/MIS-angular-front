import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { CambiarUsuarioDialogComponent } from './cambiar-usuario-dialog.component';
import { AuthService } from '../../../../auth/service/auth.service';
import type { AlternateUsuario } from '../../../../auth/model/alternate-usuario.model';

const ALTERNATES: AlternateUsuario[] = [
  { email: 'carlos.ruiz@confianza.pe', nombre: 'Carlos Ruiz', cargo: 'Supervisor' },
  { email: 'maria.lopez@confianza.pe', nombre: 'Maria Lopez' },
];

describe('CambiarUsuarioDialogComponent', () => {
  let authFalso: { alternates: ReturnType<typeof vi.fn>; cambiarAUsuarioAlterno: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authFalso = {
      alternates: vi.fn().mockReturnValue(ALTERNATES),
      cambiarAUsuarioAlterno: vi.fn().mockResolvedValue(undefined),
    };
    TestBed.configureTestingModule({
      imports: [CambiarUsuarioDialogComponent],
      providers: [{ provide: AuthService, useValue: authFalso }, MessageService],
    });
  });

  function crear(visible = true) {
    const fixture = TestBed.createComponent(CambiarUsuarioDialogComponent);
    fixture.componentRef.setInput('visible', visible);
    fixture.detectChanges();
    return fixture;
  }

  it('lista los usuarios alternos disponibles', () => {
    const fixture = crear();

    expect(fixture.componentInstance['alternates']()).toEqual(ALTERNATES);
  });

  it('iniciales() arma las iniciales a partir del nombre (máx. 2 palabras)', () => {
    const fixture = crear();

    expect(fixture.componentInstance['iniciales']('Carlos Ruiz')).toBe('CR');
    expect(fixture.componentInstance['iniciales']('Maria')).toBe('M');
  });

  it('elegir() cambia al usuario alterno y cierra el diálogo', async () => {
    const fixture = crear();
    let cerrado = false;
    fixture.componentInstance.visibleChange.subscribe((v: boolean) => (cerrado = v === false));

    await fixture.componentInstance['elegir'](ALTERNATES[0]);

    expect(authFalso.cambiarAUsuarioAlterno).toHaveBeenCalledWith(ALTERNATES[0]);
    expect(cerrado).toBe(true);
  });

  it('elegir() muestra un toast de error y no cierra el diálogo si el backend falla', async () => {
    authFalso.cambiarAUsuarioAlterno.mockRejectedValue(new Error('Usuario alterno no autorizado'));
    const fixture = crear();
    let emitido = false;
    fixture.componentInstance.visibleChange.subscribe(() => (emitido = true));

    await fixture.componentInstance['elegir'](ALTERNATES[0]);

    expect(emitido).toBe(false);
    expect(fixture.componentInstance['cambiando']()).toBeNull();
  });

  it('cerrar() emite visibleChange(false)', () => {
    const fixture = crear();
    let valor: boolean | undefined;
    fixture.componentInstance.visibleChange.subscribe((v: boolean) => (valor = v));

    fixture.componentInstance['cerrar']();

    expect(valor).toBe(false);
  });

  it('sin alternates asignados, la lista queda vacía', () => {
    authFalso.alternates.mockReturnValue([]);
    const fixture = crear();

    expect(fixture.componentInstance['alternates']()).toEqual([]);
  });
});
