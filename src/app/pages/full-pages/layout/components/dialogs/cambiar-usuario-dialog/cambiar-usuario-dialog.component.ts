import { Component, computed, inject, input, output, signal } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideUsers } from '@ng-icons/lucide';
import { AuthService } from '../../../../auth/service/auth.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import type { AlternateUsuario } from '../../../../auth/model/alternate-usuario.model';

/**
 * Diálogo "Cambiar usuario" — estilo selector de cuentas de Google: una
 * lista de usuarios alternos, cada uno cambia de inmediato al hacer clic
 * (sin paso de selección + confirmación aparte).
 *
 * Migra la funcionalidad de `AltUserDialogComponent` de STG (lista de
 * `alternates`, `LoginService.onAltLogin`) — la mecánica de negocio es la
 * misma (elegir un alterno de la lista, ver `AuthService.cambiarAUsuarioAlterno`),
 * solo cambia la interacción de UI a un clic directo por fila.
 */
@Component({
  selector: 'app-cambiar-usuario-dialog',
  standalone: true,
  imports: [DialogModule, ButtonModule, NgIconComponent],
  viewProviders: [provideIcons({ lucideUsers })],
  templateUrl: './cambiar-usuario-dialog.component.html',
  styleUrl: './cambiar-usuario-dialog.component.css',
})
export class CambiarUsuarioDialogComponent {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly visible = input(false);
  readonly visibleChange = output<boolean>();

  protected readonly alternates = computed(() => this.auth.alternates());
  /** Email del alterno que se está cambiando en este momento (null = ninguno en curso). */
  protected readonly cambiando = signal<string | null>(null);

  protected async elegir(alterno: AlternateUsuario): Promise<void> {
    if (this.cambiando()) return;

    this.cambiando.set(alterno.email);
    try {
      await this.auth.cambiarAUsuarioAlterno(alterno);
      this.cerrar();
    } catch (err: any) {
      this.toast.error('No se pudo cambiar de usuario', err?.message);
    } finally {
      this.cambiando.set(null);
    }
  }

  protected cerrar(): void {
    this.visibleChange.emit(false);
  }

  protected iniciales(nombre: string): string {
    return nombre
      .split(' ')
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }
}
