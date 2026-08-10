import { Component, computed, inject, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { IncentivosService } from '../../services/incentivos.service';

/**
 * Panel de Monetización — migrado de `MonetizadoComponent` (legado STG,
 * `pages/modules/incentivos3/monetizado`). No migra el selector de fecha de
 * corte (`mat-menu`+`mat-calendar` filtrado a `profile.hab_fec`): ese campo
 * no lo expone todavía el `UsuarioActivo` de este Host — ver la nota de
 * gap de datos en `IncentivosService`. La fecha se muestra de solo lectura.
 */
@Component({
  selector: 'app-monetizado-card',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './monetizado-card.component.html',
  styleUrl: './monetizado-card.component.css',
})
export class MonetizadoCardComponent {
  protected readonly incentivos = inject(IncentivosService);

  readonly abrirCalculadora = output<void>();

  protected readonly fechaCorteFormateada = computed(() => {
    const f = this.incentivos.fechaCorte();
    return `${f.slice(0, 4)}-${f.slice(4, 6)}-${f.slice(6, 8)}`;
  });

  protected claseBonoSuperPlus(): string {
    return this.incentivos.monetizado().bonoSuperPlus < 0 ? 'text-[var(--mis-danger)]' : '';
  }

  protected claseSituacion(): string {
    return this.incentivos.monetizado().codigoSituacion === 1 ? 'text-[var(--mis-success)]' : 'text-[var(--mis-danger)]';
  }
}
