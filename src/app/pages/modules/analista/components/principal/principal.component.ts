import { Component, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { TooltipModule } from 'primeng/tooltip';
import { ListSkeletonComponent } from '../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { InlineErrorComponent } from '../../../../../shared/ui/inline-error/inline-error.component';
import { WindowPanelComponent } from '../../../../../shared/ui/window-panel/window-panel.component';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import { SelectorColaboradorDialogComponent } from '../../ui/selector-colaborador-dialog/selector-colaborador-dialog.component';
import { DetalleTablaDialogComponent } from '../../ui/detalle-tabla-dialog/detalle-tabla-dialog.component';
import { AnalistaService } from '../../services/analista.service';
import { crearSelectorColaborador } from '../../utils/colaborador-selector.util';
import type { ColaboradorItem } from '../../models/colaborador.model';
import type { FilaLabelValor } from '../../models/comun.model';
import type { DatosGraficoLinea, FilaClienteCredito, HistoricoVariable, ResumenDashboard } from '../../models/dashboard.model';

/** Paleta fija (mismo tinte navy/sky del sistema — Chart.js no resuelve variables CSS). */
const COLOR_PRIMARY = '#1D396E';
const COLOR_SECONDARY = '#00A2FF';
const PALETA_TRAMOS = ['#16A34A', '#00A2FF', '#B45309', '#DC2626', '#7C3AED', '#334155'];

const OPCIONES_BASE = { responsive: true, maintainAspectRatio: false };

/** Principal (`/app/analista`) — dashboard del analista: KPIs, perfil, 3 gráficos y tabla de clientes con detalle. */
@Component({
  selector: 'app-principal-analista',
  standalone: true,
  imports: [
    DecimalPipe,
    FormsModule,
    ButtonModule,
    SelectModule,
    TableModule,
    ChartModule,
    TooltipModule,
    ListSkeletonComponent,
    InlineErrorComponent,
    EmptyStateComponent,
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

  protected readonly dialogDetalleAbierto = signal(false);
  protected readonly detalleCliente = signal<FilaLabelValor[]>([]);
  protected readonly cargandoDetalle = signal(false);

  protected readonly opcionesComparativoDia = {
    ...OPCIONES_BASE,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
  };

  protected readonly opcionesCarteraTramos = {
    ...OPCIONES_BASE,
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } },
  };

  protected readonly opcionesEvolutivo = {
    ...OPCIONES_BASE,
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } },
    scales: { y: { beginAtZero: true } },
  };

  protected readonly datosComparativoDia = computed(() => {
    const d = this.dashboard()?.data;
    if (!d) return null;
    return {
      labels: [d.f3, d.f2, d.f1],
      datasets: [{ label: 'Cartera Stock', data: [d.sal_cap_mant, d.sal_cap_ant, d.sal_cap], backgroundColor: COLOR_PRIMARY }],
    };
  });

  protected readonly datosCarteraTramos = computed(() => {
    const d = this.dashboard()?.data;
    if (!d) return null;
    return {
      labels: ['<-30', '[-30 a 0]', '[1 a 30]', '[31 a 60]', '61>', 'Judicial'],
      datasets: [{ data: [d.da_t1, d.da_t2, d.da_t3, d.da_t4, d.da_t5, d.da_t6], backgroundColor: PALETA_TRAMOS }],
    };
  });

  protected readonly datosEvolutivo = signal<DatosGraficoLinea | null>(null);

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
        this.datosEvolutivo.set(historico ? this.aDatosEvolutivo(historico) : null);
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
    this.datosEvolutivo.set(null);
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

  private aDatosEvolutivo(h: HistoricoVariable): DatosGraficoLinea {
    const largo = Math.max(h.his_1.length, h.his_2.length, h.his_3.length);
    const labels = Array.from({ length: largo }, (_, i) => `${i + 1}`);
    return {
      labels,
      datasets: [
        { label: h.meta.s1, data: h.his_1, borderColor: COLOR_PRIMARY, backgroundColor: COLOR_PRIMARY, tension: 0.3 },
        { label: h.meta.s2, data: h.his_2, borderColor: COLOR_SECONDARY, backgroundColor: COLOR_SECONDARY, tension: 0.3 },
        { label: h.meta.s3, data: h.his_3, borderColor: PALETA_TRAMOS[2], backgroundColor: PALETA_TRAMOS[2], tension: 0.3 },
      ],
    };
  }
}
