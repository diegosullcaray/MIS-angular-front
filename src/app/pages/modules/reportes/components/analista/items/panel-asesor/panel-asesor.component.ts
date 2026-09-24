import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SelectModule } from 'primeng/select';
import { WindowPanelComponent } from '../../../../../../../shared/ui/window-panel/window-panel.component';
import { InlineErrorComponent } from '../../../../../../../shared/ui/inline-error/inline-error.component';
import { EmptyStateComponent } from '../../../../../../../shared/ui/empty-state/empty-state.component';
import { ListSkeletonComponent } from '../../../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { GraficoMixtoComponent } from '../../../../../../../shared/ui/graficos/grafico-mixto/grafico-mixto.component';
import { BloquePanelComponent } from '../../ui/bloque-panel/bloque-panel.component';
import { PanelAsesorService } from '../../services/panel-asesor.service';
import { PanelAsesorConsultasService } from '../../services/panel-asesor-consultas.service';
import {
  CODIGO_EFECTIVIDADES,
  GRUPOS_PANEL_ASESOR,
  REPORTES_ASESOR,
} from '../../constantes/panel-asesor.constantes';
import {
  OPCIONES_PRODUCTO,
  OPCIONES_SI_NO,
  OPCIONES_TRAMO,
  OPCIONES_TRAMO_DIAS_GESTION,
  type FiltrosMonitorEfectividades,
} from '../../models/monitor-efectividades.model';
import type { GrupoPanelAsesor, KpiPanelAsesor, ReportePanelAsesor, ResultadoPanelAsesor } from '../../models/panel-asesor.model';
import { bloquesDe, gruposOrdenados, kpisDeTotales, semaforoKpi, sinDatos } from '../../utils/panel-asesor.util';

type PestanaPanel = 'resumen' | GrupoPanelAsesor;

interface FiltroEfectividades {
  campo: keyof FiltrosMonitorEfectividades;
  etiqueta: string;
  opciones: { id: string; desc: string }[];
}

/** Filtros reales de `mon_efec_sec`, con las mismas variables del legado. */
const FILTROS_EFECTIVIDADES: readonly FiltroEfectividades[] = [
  { campo: 'tramof', etiqueta: 'Tramo', opciones: OPCIONES_TRAMO },
  { campo: 'prod', etiqueta: 'Producto', opciones: OPCIONES_PRODUCTO },
  { campo: 'comp_r', etiqueta: 'Compromiso roto', opciones: OPCIONES_SI_NO },
  { campo: 'zcuo', etiqueta: '0 cuota', opciones: OPCIONES_SI_NO },
  { campo: 'ucuo', etiqueta: '1 cuota', opciones: OPCIONES_SI_NO },
  { campo: 'tdcr', etiqueta: 'Tramo días gestión', opciones: OPCIONES_TRAMO_DIAS_GESTION },
];

/**
 * Panel unificado del asesor: vista 360 con KPI, gráficos y tablas reales de Ant,
 * y los 17 reportes de `rda/sectorista` agrupados por categoría y ordenados por uso.
 */
@Component({
  selector: 'app-panel-unificado',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    SelectModule,
    WindowPanelComponent,
    InlineErrorComponent,
    EmptyStateComponent,
    ListSkeletonComponent,
    GraficoMixtoComponent,
    BloquePanelComponent,
  ],
  providers: [PanelAsesorService, PanelAsesorConsultasService],
  templateUrl: './panel-asesor.component.html',
  styleUrl: './panel-asesor.component.css',
})
export class PanelAsesorComponent {
  protected readonly panel = inject(PanelAsesorService);

  protected readonly grupos = gruposOrdenados(GRUPOS_PANEL_ASESOR, REPORTES_ASESOR);
  protected readonly filtrosEfectividades = FILTROS_EFECTIVIDADES;
  protected readonly codigoEfectividades = CODIGO_EFECTIVIDADES;

  /** Último reporte abierto en cada categoría, para volver donde se estaba. */
  private readonly ultimoPorGrupo = signal<Partial<Record<GrupoPanelAsesor, string>>>({});

  protected readonly reporteActivo = computed<ReportePanelAsesor | null>(() => {
    const vista = this.panel.vista();
    return vista === 'resumen' ? null : (REPORTES_ASESOR.find((r) => r.codigo === vista) ?? null);
  });

  protected readonly pestanaActiva = computed<PestanaPanel>(() => this.reporteActivo()?.grupo ?? 'resumen');

  protected readonly reportesDelGrupo = computed(
    () => this.grupos.find((g) => g.grupo.id === this.pestanaActiva())?.reportes ?? [],
  );

  protected readonly estadoActivo = computed(() => {
    const reporte = this.reporteActivo();
    return reporte ? this.panel.estado(reporte.codigo) : null;
  });

  protected readonly subtitulo = computed(() => this.panel.asesor()?.nombre ?? 'Reportes consolidados');

  // --- Vista 360 ---
  protected readonly estadoCartera = computed(() => this.panel.estado('L_CART_SEC'));
  protected readonly estadoDesembolso = computed(() => this.panel.estado('L_MONI_DESE_SEC'));
  protected readonly estadoMora = computed(() => this.panel.estado('L_INVERS_STOCK_SEC'));

  protected readonly kpisCartera = computed<KpiPanelAsesor[]>(() => {
    const e = this.estadoCartera();
    return e?.estado === 'listo' ? kpisDeTotales(e.resultado.tabla1) : [];
  });

  protected readonly kpisDesembolso = computed<KpiPanelAsesor[]>(() => {
    const e = this.estadoDesembolso();
    if (e?.estado !== 'listo') return [];
    const { kpiOperaciones, kpiMonto } = e.resultado;
    return [
      {
        etiqueta: 'Operaciones desembolsadas · cumplimiento',
        valor: kpiOperaciones?.cumpl_des_acum || '--',
        semaforo: semaforoKpi(kpiOperaciones?.style_cumpl_des_acum),
      },
      {
        etiqueta: 'Monto desembolsado · cumplimiento',
        valor: kpiMonto?.cumpl_ope_acum || '--',
        semaforo: semaforoKpi(kpiMonto?.style_cumpl_ope_acum),
      },
    ];
  });

  protected readonly corteDesembolso = computed(() => {
    const e = this.estadoDesembolso();
    const kpi = e?.estado === 'listo' ? e.resultado.kpiOperaciones : null;
    return kpi?.fecha ? `Actualizado al ${kpi.fecha}${kpi.hora ? ' ' + kpi.hora : ''}` : '';
  });

  protected abrirPestana(pestana: PestanaPanel): void {
    if (pestana === 'resumen') {
      this.panel.seleccionarVista('resumen');
      return;
    }
    const grupo = this.grupos.find((g) => g.grupo.id === pestana);
    const destino = this.ultimoPorGrupo()[pestana] ?? grupo?.reportes[0]?.codigo;
    if (destino) this.abrirReporte(destino);
  }

  protected abrirReporte(codigo: string | null): void {
    const reporte = REPORTES_ASESOR.find((r) => r.codigo === codigo);
    if (!reporte) return;
    this.ultimoPorGrupo.update((u) => ({ ...u, [reporte.grupo]: reporte.codigo }));
    this.panel.seleccionarVista(reporte.codigo);
  }

  protected bloques(reporte: ReportePanelAsesor, resultado: ResultadoPanelAsesor) {
    return bloquesDe(reporte, resultado);
  }

  protected vacio(resultado: ResultadoPanelAsesor): boolean {
    return sinDatos(resultado);
  }

  protected claseSemaforo(semaforo: KpiPanelAsesor['semaforo']): string {
    return semaforo === 1 ? 'kpi-ok' : semaforo === 0 ? 'kpi-alerta' : semaforo === -1 ? 'kpi-riesgo' : '';
  }

  protected iconoSemaforo(semaforo: KpiPanelAsesor['semaforo']): string {
    return semaforo === 1 ? 'pi pi-check-circle' : semaforo === 0 ? 'pi pi-minus-circle' : 'pi pi-times-circle';
  }

  protected textoSemaforo(semaforo: KpiPanelAsesor['semaforo']): string {
    return semaforo === 1 ? 'Semáforo verde' : semaforo === 0 ? 'Semáforo ámbar' : 'Semáforo rojo';
  }
}
