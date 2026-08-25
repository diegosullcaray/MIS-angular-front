import { Component, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ListSkeletonComponent } from '../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { InlineErrorComponent } from '../../../../../shared/ui/inline-error/inline-error.component';
import { WindowPanelComponent } from '../../../../../shared/ui/window-panel/window-panel.component';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import { GraficoMixtoComponent } from '../../../../../shared/ui/graficos/grafico-mixto/grafico-mixto.component';
import { GraficoPieComponent } from '../../../../../shared/ui/graficos/grafico-pie/grafico-pie.component';
import { COLOR_PRIMARY, COLOR_SECONDARY, PALETA_TRAMOS } from '../../../../../shared/ui/graficos/utils/paleta-colores.util';
import { SelectorColaboradorDialogComponent } from '../../ui/selector-colaborador-dialog/selector-colaborador-dialog.component';
import { DetalleTablaDialogComponent } from '../../ui/detalle-tabla-dialog/detalle-tabla-dialog.component';
import { AnalistaService } from '../../services/analista.service';
import { crearSelectorColaborador } from '../../utils/colaborador-selector.util';
import type { ColaboradorItem } from '../../models/colaborador.model';
import type { FilaLabelValor } from '../../models/comun.model';
import type { FilaClienteCredito, HistoricoVariable, ResumenDashboard } from '../../models/dashboard.model';
import type { BloqueGrafico, PorcionGrafico } from '../../../../../shared/ui/graficos/models/grafico-comun.model';

/** Tramos de mora del gráfico de torta, en el orden en que vienen (`da_t1`..`da_t6`). */
const LABELS_TRAMOS = ['<-30', '[-30 a 0]', '[1 a 30]', '[31 a 60]', '61>', 'Judicial'];

/** Colores del evolutivo mensual: navy, sky y el ámbar de los tramos. */
const COLORES_EVOLUTIVO = [COLOR_PRIMARY, COLOR_SECONDARY, PALETA_TRAMOS[2]];

/** Principal (`/app/analista`) — dashboard del analista: KPIs, perfil, 3 gráficos (`shared/ui/graficos`) y tabla de clientes con detalle. */
@Component({
  selector: 'app-principal-analista',
  standalone: true,
  imports: [
    DecimalPipe,
    FormsModule,
    ButtonModule,
    SelectModule,
    TableModule,
    TooltipModule,
    ListSkeletonComponent,
    InlineErrorComponent,
    EmptyStateComponent,
    GraficoMixtoComponent,
    GraficoPieComponent,
    SelectorColaboradorDialogComponent,
    DetalleTablaDialogComponent,
    WindowPanelComponent,
  ],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.css',
})
export class PrincipalComponent implements OnInit {
  private readonly analista = inject(AnalistaService);
  private readonly router = inject(Router);

  protected readonly selectorColaborador = crearSelectorColaborador(this.analista);
  protected readonly esAdmin = this.selectorColaborador.esAdmin;
  protected readonly colaborador = this.selectorColaborador.colaboradorActivo;
  protected readonly dialogColaboradorAbierto = this.selectorColaborador.dialogAbierto;
  protected readonly colaboradores = this.selectorColaborador.colaboradores;
  protected readonly cargandoColaboradores = this.selectorColaborador.cargando;

  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly dashboard = signal<ResumenDashboard | null>(null);

  protected readonly cargandoHistorico = signal(false);
  protected readonly variableActual = signal<string | null>(null);
  protected readonly evolutivo = signal<BloqueGrafico | null>(null);

  /** "Comparativo Día": el saldo de capital de los tres cortes que trae el resumen. */
  protected readonly comparativoDia = computed<BloqueGrafico | null>(() => {
    const d = this.dashboard()?.data;
    if (!d) return null;
    return {
      titulo: '',
      categorias: [d.f3, d.f2, d.f1],
      series: [{ nombre: 'Cartera Stock', datos: [d.sal_cap_mant, d.sal_cap_ant, d.sal_cap], color: COLOR_PRIMARY }],
    };
  });

  /** "Cartera por Tramos de Mora": una porción por tramo (`da_t1`..`da_t6`). */
  protected readonly tramosMora = computed<PorcionGrafico[]>(() => {
    const d = this.dashboard()?.data;
    if (!d) return [];
    const valores = [d.da_t1, d.da_t2, d.da_t3, d.da_t4, d.da_t5, d.da_t6];
    return LABELS_TRAMOS.map((nombre, i) => ({ nombre, valor: valores[i], color: PALETA_TRAMOS[i] }));
  });

  protected readonly dialogDetalleAbierto = signal(false);
  protected readonly detalleCliente = signal<FilaLabelValor[]>([]);
  protected readonly cargandoDetalle = signal(false);

  constructor() {
    effect(() => {
      const c = this.colaborador();
      if (c) untracked(() => this.cargar(c.codBt));
    });
  }

  ngOnInit(): void {
    this.selectorColaborador.inicializar();
  }

  protected abrirSelectorColaborador(): void {
    this.selectorColaborador.abrir();
  }

  protected onColaboradorSeleccionado(item: ColaboradorItem): void {
    this.selectorColaborador.seleccionar(item);
  }

  protected cambiarVariable(cod: string): void {
    const c = this.colaborador();
    if (!c) return;

    this.variableActual.set(cod);
    this.cargandoHistorico.set(true);
    this.analista.obtenerHistoricoVariable(c.codBt, cod).subscribe({
      next: (historico) => {
        this.evolutivo.set(historico ? this.aBloqueEvolutivo(historico) : null);
        this.cargandoHistorico.set(false);
      },
      error: () => this.cargandoHistorico.set(false),
    });
  }

  protected abrirDetalleCliente(fila: FilaClienteCredito): void {
    const c = this.colaborador();
    if (!c) return;

    this.dialogDetalleAbierto.set(true);
    this.cargandoDetalle.set(true);
    this.detalleCliente.set([]);
    this.analista.obtenerDetalleCliente(c.codBt, fila.num_doc, fila.tip_doc ?? 0, fila.pais ?? 0).subscribe({
      next: (filas) => {
        this.detalleCliente.set(filas);
        this.cargandoDetalle.set(false);
      },
      error: () => this.cargandoDetalle.set(false),
    });
  }

  protected irAListas(): void {
    this.router.navigate(['/app/analista/listas']);
  }

  protected reintentar(): void {
    const c = this.colaborador();
    if (c) this.cargar(c.codBt);
  }

  private cargar(codBt: string): void {
    this.cargando.set(true);
    this.error.set(null);
    this.evolutivo.set(null);
    this.variableActual.set(null);

    this.analista.obtenerDashboard(codBt).subscribe({
      next: (resumen) => {
        if (!resumen) {
          this.error.set(`No se encontraron datos para el colaborador: ${codBt}`);
          this.dashboard.set(null);
        } else {
          this.dashboard.set(resumen);
          const primeraVariable = resumen.h_cods[0]?.cod;
          if (primeraVariable) this.cambiarVariable(primeraVariable);
        }
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el dashboard. Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }

  private aBloqueEvolutivo(h: HistoricoVariable): BloqueGrafico {
    const largo = Math.max(h.his_1.length, h.his_2.length, h.his_3.length);
    const series = [
      { nombre: h.meta.s1, datos: h.his_1 },
      { nombre: h.meta.s2, datos: h.his_2 },
      { nombre: h.meta.s3, datos: h.his_3 },
    ];
    return {
      titulo: '',
      categorias: Array.from({ length: largo }, (_, i) => `${i + 1}`),
      series: series.map((s, i) => ({ ...s, color: COLORES_EVOLUTIVO[i % COLORES_EVOLUTIVO.length] })),
    };
  }
}
