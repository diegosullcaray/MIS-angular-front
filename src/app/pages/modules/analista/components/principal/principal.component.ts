import { Component, DestroyRef, ElementRef, OnInit, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
// El build ESM de Highcharts 13 solo expone `default` en runtime, pero sus
// tipos son exports con nombre — de ahí la importación partida en dos.
import Highcharts from 'highcharts';
import type { Chart as HighchartsChart, Options as HighchartsOptions } from 'highcharts';
import { TooltipModule } from 'primeng/tooltip';
import { ListSkeletonComponent } from '../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { InlineErrorComponent } from '../../../../../shared/ui/inline-error/inline-error.component';
import { WindowPanelComponent } from '../../../../../shared/ui/window-panel/window-panel.component';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import { SelectorColaboradorDialogComponent } from '../../ui/selector-colaborador-dialog/selector-colaborador-dialog.component';
import { DetalleTablaDialogComponent } from '../../ui/detalle-tabla-dialog/detalle-tabla-dialog.component';
import { AnalistaService } from '../../services/analista.service';
import { ThemeService } from '../../../../full-pages/layout/services/theme.service';
import { crearSelectorColaborador } from '../../utils/colaborador-selector.util';
import type { ColaboradorItem } from '../../models/colaborador.model';
import type { FilaLabelValor } from '../../models/comun.model';
import type { DatosResumenAnalista, FilaClienteCredito, HistoricoVariable, ResumenDashboard } from '../../models/dashboard.model';

/** Paleta fija (mismo tinte navy/sky del sistema — Highcharts, como Chart.js antes, no resuelve variables CSS en su config). */
const COLOR_PRIMARY = '#1D396E';
const COLOR_SECONDARY = '#00A2FF';
const PALETA_TRAMOS = ['#16A34A', '#00A2FF', '#B45309', '#DC2626', '#7C3AED', '#334155'];
const LABELS_TRAMOS = ['<-30', '[-30 a 0]', '[1 a 30]', '[31 a 60]', '61>', 'Judicial'];

/** Texto/grilla de los ejes: mismo criterio que `GraficoReporteComponent`/`HeatmapComponent` (`--mis-text-secondary` claro/oscuro). */
const COLOR_TEXTO_CLARO = '#5A6A85';
const COLOR_TEXTO_OSCURO = '#A3B2C9';
const GRID_CLARO = 'rgba(90,106,133,0.12)';
const GRID_OSCURO = 'rgba(163,178,201,0.12)';

/** Serie del gráfico "Evolutivo Mensual", ya lista para Highcharts. */
interface DatosEvolutivo {
  categorias: string[];
  series: { name: string; data: number[] }[];
}

/** Principal (`/app/analista`) — dashboard del analista: KPIs, perfil, 3 gráficos (Highcharts, igual patrón imperativo que `GraficoReporteComponent`) y tabla de clientes con detalle. */
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
  private readonly tema = inject(ThemeService);

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
  protected readonly datosEvolutivo = signal<DatosEvolutivo | null>(null);

  protected readonly dialogDetalleAbierto = signal(false);
  protected readonly detalleCliente = signal<FilaLabelValor[]>([]);
  protected readonly cargandoDetalle = signal(false);

  private readonly comparativoRef = viewChild<ElementRef<HTMLDivElement>>('comparativo');
  private readonly evolutivoRef = viewChild<ElementRef<HTMLDivElement>>('evolutivo');
  private readonly tramosRef = viewChild<ElementRef<HTMLDivElement>>('tramos');

  private chartComparativo: HighchartsChart | null = null;
  private chartEvolutivo: HighchartsChart | null = null;
  private chartTramos: HighchartsChart | null = null;

  constructor() {
    effect(() => {
      const c = this.colaborador();
      if (c) untracked(() => this.cargar(c.codBt));
    });

    effect(() => {
      const el = this.comparativoRef()?.nativeElement;
      const d = this.dashboard()?.data;
      const oscuro = this.tema.oscuro();
      if (el && d) this.renderComparativoDia(el, d, oscuro);
    });

    effect(() => {
      const el = this.tramosRef()?.nativeElement;
      const d = this.dashboard()?.data;
      const oscuro = this.tema.oscuro();
      if (el && d) this.renderCarteraTramos(el, d, oscuro);
    });

    effect(() => {
      const el = this.evolutivoRef()?.nativeElement;
      const datos = this.datosEvolutivo();
      const oscuro = this.tema.oscuro();
      if (el && datos) this.renderEvolutivo(el, datos, oscuro);
    });

    inject(DestroyRef).onDestroy(() => {
      this.chartComparativo?.destroy();
      this.chartEvolutivo?.destroy();
      this.chartTramos?.destroy();
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

  private aDatosEvolutivo(h: HistoricoVariable): DatosEvolutivo {
    const largo = Math.max(h.his_1.length, h.his_2.length, h.his_3.length);
    return {
      categorias: Array.from({ length: largo }, (_, i) => `${i + 1}`),
      series: [
        { name: h.meta.s1, data: h.his_1 },
        { name: h.meta.s2, data: h.his_2 },
        { name: h.meta.s3, data: h.his_3 },
      ],
    };
  }

  /** Base común de los tres gráficos: fondo transparente y textos según el tema. */
  private baseHighcharts(oscuro: boolean): HighchartsOptions {
    const texto = oscuro ? COLOR_TEXTO_OSCURO : COLOR_TEXTO_CLARO;
    return {
      chart: { backgroundColor: 'transparent', style: { fontFamily: 'inherit' }, animation: false },
      title: { text: undefined },
      credits: { enabled: false },
      accessibility: { enabled: false },
      plotOptions: { series: { animation: false } },
      tooltip: {
        backgroundColor: oscuro ? '#162034' : '#FFFFFF',
        borderColor: oscuro ? GRID_OSCURO : GRID_CLARO,
        style: { color: oscuro ? '#E8EEF9' : '#304156', fontSize: '12px' },
      },
      legend: { itemStyle: { color: texto, fontSize: '10px', fontWeight: '500' } },
    };
  }

  private renderComparativoDia(el: HTMLElement, d: DatosResumenAnalista, oscuro: boolean): void {
    const texto = oscuro ? COLOR_TEXTO_OSCURO : COLOR_TEXTO_CLARO;
    this.chartComparativo?.destroy();
    this.chartComparativo = Highcharts.chart(el, {
      ...this.baseHighcharts(oscuro),
      chart: { ...this.baseHighcharts(oscuro).chart, type: 'column' },
      xAxis: { categories: [d.f3, d.f2, d.f1], labels: { style: { color: texto, fontSize: '10px' } }, lineColor: oscuro ? GRID_OSCURO : GRID_CLARO },
      yAxis: { min: 0, title: { text: undefined }, labels: { style: { color: texto, fontSize: '10px' } }, gridLineColor: oscuro ? GRID_OSCURO : GRID_CLARO },
      legend: { enabled: false },
      series: [{ type: 'column', name: 'Cartera Stock', data: [d.sal_cap_mant, d.sal_cap_ant, d.sal_cap], color: COLOR_PRIMARY }],
    });
  }

  private renderCarteraTramos(el: HTMLElement, d: DatosResumenAnalista, oscuro: boolean): void {
    const valores = [d.da_t1, d.da_t2, d.da_t3, d.da_t4, d.da_t5, d.da_t6];
    this.chartTramos?.destroy();
    this.chartTramos = Highcharts.chart(el, {
      ...this.baseHighcharts(oscuro),
      chart: { ...this.baseHighcharts(oscuro).chart, type: 'pie' },
      legend: { ...this.baseHighcharts(oscuro).legend, enabled: true, align: 'center', verticalAlign: 'bottom', layout: 'horizontal' },
      plotOptions: { pie: { showInLegend: true, dataLabels: { enabled: false }, borderWidth: 0 } },
      series: [{
        type: 'pie',
        name: 'Cartera',
        data: LABELS_TRAMOS.map((name, i) => ({ name, y: valores[i], color: PALETA_TRAMOS[i] })),
      }],
    });
  }

  private renderEvolutivo(el: HTMLElement, datos: DatosEvolutivo, oscuro: boolean): void {
    const texto = oscuro ? COLOR_TEXTO_OSCURO : COLOR_TEXTO_CLARO;
    const colores = [COLOR_PRIMARY, COLOR_SECONDARY, PALETA_TRAMOS[2]];
    this.chartEvolutivo?.destroy();
    this.chartEvolutivo = Highcharts.chart(el, {
      ...this.baseHighcharts(oscuro),
      chart: { ...this.baseHighcharts(oscuro).chart, type: 'spline' },
      xAxis: { categories: datos.categorias, labels: { style: { color: texto, fontSize: '10px' } }, lineColor: oscuro ? GRID_OSCURO : GRID_CLARO },
      yAxis: { min: 0, title: { text: undefined }, labels: { style: { color: texto, fontSize: '10px' } }, gridLineColor: oscuro ? GRID_OSCURO : GRID_CLARO },
      legend: { ...this.baseHighcharts(oscuro).legend, enabled: true, align: 'center', verticalAlign: 'bottom', layout: 'horizontal' },
      series: datos.series.map((s, i) => ({ type: 'spline' as const, name: s.name, data: s.data, color: colores[i % colores.length], marker: { enabled: false } })),
    });
  }
}
