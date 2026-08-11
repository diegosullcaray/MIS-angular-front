import { Component, effect, inject, signal } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { IncentivosService } from '../../services/incentivos.service';
import { PerfilCardComponent } from '../../ui/perfil-card/perfil-card.component';
import { AvancesGridComponent, type DetalleAvanceEvent } from '../../ui/avances-grid/avances-grid.component';
import { SuperPlusGridComponent, type DetalleSuperPlusEvent } from '../../ui/super-plus-grid/super-plus-grid.component';
import { TablaVariablesComponent, type DetalleTablaVariableEvent } from '../../ui/tabla-variables/tabla-variables.component';
import { SelectorNivelDialogComponent } from '../../ui/selector-nivel-dialog/selector-nivel-dialog.component';
import { CalculadoraDialogComponent } from '../../ui/calculadora-dialog/calculadora-dialog.component';
import { DetalleVariableDialogComponent } from '../../ui/detalle-variable-dialog/detalle-variable-dialog.component';
import { DetalleBancarizacionDialogComponent } from '../../ui/detalle-bancarizacion-dialog/detalle-bancarizacion-dialog.component';
import { LoadingOverlayComponent } from '../../../../../shared/ui/loading-overlay/loading-overlay.component';

type ReqDetalleVariable = 'getDetail' | 'getTasa' | 'getProd' | 'getRetencion';

interface DetalleVariableActivo {
  titulo: string;
  icono: string;
  req: ReqDetalleVariable;
  codVar: number;
  card: boolean;
}

/**
 * Cuadro de Mando de Incentivos (`/app/incentivos3`) — migrado de
 * `PrincipalComponent` (legado STG, `pages/modules/incentivos3/principal`).
 * Compone las 4 tarjetas del dashboard (Perfil+Monetización / Tabla /
 * Avances / Super Plus) y coordina la visibilidad de los 4 diálogos
 * (Selector de Nivel / Calculadora / Detalle de Variable / Detalle de
 * Bancarización) — mismo rol que cumplía `Incentivos3Service` en el legado
 * (`mDialog.open(...)` disperso en cada componente hijo), acá centralizado
 * en el componente dueño de la pantalla.
 *
 * No migra `Historico`/`Composicion`/`Aportes` — código muerto confirmado
 * por auditoría (`docs/06-legado-sistema-anterior/incentivos-auditoria.md`):
 * declarados y con datos poblados por el servicio legado, pero sin ningún
 * consumidor en ningún template.
 */
@Component({
  selector: 'app-incentivos-principal',
  standalone: true,
  imports: [
    SkeletonModule,
    ButtonModule,
    TooltipModule,
    PerfilCardComponent,
    AvancesGridComponent,
    SuperPlusGridComponent,
    TablaVariablesComponent,
    SelectorNivelDialogComponent,
    CalculadoraDialogComponent,
    DetalleVariableDialogComponent,
    DetalleBancarizacionDialogComponent,
    LoadingOverlayComponent,
  ],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.css',
})
export class PrincipalComponent {
  protected readonly incentivos = inject(IncentivosService);

  protected readonly mostrarSelector = signal(false);
  protected readonly mostrarCalculadora = signal(false);
  protected readonly mostrarDetalleVariable = signal(false);
  protected readonly mostrarDetalleBancarizacion = signal(false);
  protected readonly detalleActivo = signal<DetalleVariableActivo | null>(null);

  constructor() {
    this.incentivos.iniciar();

    effect(() => {
      if (this.incentivos.requiereSeleccionInicial()) this.mostrarSelector.set(true);
    });
  }

  protected abrirSelector(): void {
    this.mostrarSelector.set(true);
  }

  protected actualizar(): void {
    this.incentivos.actualizar();
  }

  protected abrirCalculadora(): void {
    this.mostrarCalculadora.set(true);
  }

  /** Filas de la tabla de Variables/Efectividad abren el mismo diálogo que Avances (`getDetail`, con tarjetas KPI) — el detalle nunca se muestra embebido en la tabla. */
  protected abrirDetalleTabla(evento: DetalleTablaVariableEvent): void {
    this.detalleActivo.set({ titulo: evento.titulo, icono: evento.icono, req: 'getDetail', codVar: evento.codVar, card: true });
    this.mostrarDetalleVariable.set(true);
  }

  /** Avances siempre abre el mismo diálogo (`getDetail`, con tarjetas KPI) — igual que `dialogDet()` de `AvancesComponent` en el legado. */
  protected abrirDetalleAvance(evento: DetalleAvanceEvent): void {
    this.detalleActivo.set({ titulo: evento.item.des, icono: evento.item.icono, req: 'getDetail', codVar: evento.codVar, card: true });
    this.mostrarDetalleVariable.set(true);
  }

  /** Super Plus decide el diálogo según `comp` — `1` abre Detalle de Variable, `2` abre Detalle de Bancarización (único caso real: "clib"). */
  protected abrirDetalleSuperPlus(evento: DetalleSuperPlusEvent): void {
    const parametros = evento.item.parametros;
    if (parametros.comp === 2) {
      this.mostrarDetalleBancarizacion.set(true);
      return;
    }
    this.detalleActivo.set({
      titulo: evento.item.des,
      icono: evento.item.icono,
      req: parametros.req as ReqDetalleVariable,
      codVar: evento.codVar,
      card: parametros.card,
    });
    this.mostrarDetalleVariable.set(true);
  }
}
