import { Component, ElementRef, Injector, afterNextRender, computed, effect, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { WindowPanelComponent } from '../../../../../../../shared/ui/window-panel/window-panel.component';
import { InlineErrorComponent } from '../../../../../../../shared/ui/inline-error/inline-error.component';
import { EmptyStateComponent } from '../../../../../../../shared/ui/empty-state/empty-state.component';
import { ListSkeletonComponent } from '../../../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { GraficoMixtoComponent } from '../../../../../../../shared/ui/graficos/grafico-mixto/grafico-mixto.component';
import { GrupoFiltrosComponent } from '../../../../../../../shared/ui/formularios/grupo-filtros/grupo-filtros.component';
import { BloquePanelComponent } from '../../ui/bloque-panel/bloque-panel.component';
import { PanelAsesorService } from '../../services/panel-asesor.service';
import { PanelAsesorConsultasService } from '../../services/panel-asesor-consultas.service';
import { CODIGO_EFECTIVIDADES, DOMINIOS_PANEL, REPORTES_ASESOR } from '../../constantes/panel-asesor.constantes';
import {
  OPCIONES_PRODUCTO,
  OPCIONES_SI_NO,
  OPCIONES_TRAMO,
  OPCIONES_TRAMO_DIAS_GESTION,
  type FiltrosMonitorEfectividades,
} from '../../models/monitor-efectividades.model';
import type {
  DominioPanel,
  DominioPanelDef,
  ReportePanelAsesor,
  ResultadoPanelAsesor,
  ResumenDominio,
  TonoPanel,
} from '../../models/panel-asesor.model';
import { bloquesDe, sinDatos } from '../../utils/panel-asesor.util';
import { FUENTES_DOMINIO, resumenDominio, type ResultadosPanel } from '../../utils/panel-resumen.util';
import { TABLA_PENDIENTE, type TablaReporteResultado } from '../../../../models/tabla-reporte.model';

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

/** Centra el chip activo en su fila (scroll lateral) y, si se pide, le da el foco. */
function centrarActiva(fila: HTMLElement, enfocar = false): void {
  const activa = fila.querySelector<HTMLElement>('.mis-chip--activo');
  if (!activa) return;
  fila.scrollLeft = activa.offsetLeft - fila.offsetLeft - (fila.clientWidth - activa.offsetWidth) / 2;
  if (enfocar) activa.focus({ preventScroll: true });
}

type EstadoTarjeta = 'cargando' | 'error' | 'vacio' | 'listo';

interface TarjetaPanel {
  dominio: DominioPanelDef;
  estado: EstadoTarjeta;
  resumen: ResumenDominio;
}

/** Panel unificado del asesor: una tarjeta por dominio con datos reales y su detalle en un diálogo. */
@Component({
  selector: 'app-panel-unificado',
  standalone: true,
  imports: [
    FormsModule,
    SelectModule,
    DialogModule,
    WindowPanelComponent,
    InlineErrorComponent,
    EmptyStateComponent,
    ListSkeletonComponent,
    GraficoMixtoComponent,
    BloquePanelComponent,
    GrupoFiltrosComponent,
  ],
  providers: [PanelAsesorService, PanelAsesorConsultasService],
  templateUrl: './panel-asesor.component.html',
  styleUrl: './panel-asesor.component.css',
})
export class PanelAsesorComponent {
  protected readonly panel = inject(PanelAsesorService);

  protected readonly dominios = DOMINIOS_PANEL;
  protected readonly filtrosEfectividades = FILTROS_EFECTIVIDADES;

  /** Fecha de corte: la que informa el monitor de desembolsos, o hoy si aún no llegó. */
  private readonly corte = computed(() => {
    const e = this.panel.estado('L_MONI_DESE_SEC');
    const fecha = e?.estado === 'listo' ? e.resultado.kpiOperaciones?.fecha : undefined;
    const m = fecha ? /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(fecha) : null;
    return m ? new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])) : new Date();
  });

  /** Resultados ya recibidos, por `SCODSEC`. */
  private readonly resultados = computed<ResultadosPanel>(() => {
    const listos: Record<string, ResultadoPanelAsesor> = {};
    for (const r of REPORTES_ASESOR) {
      const e = this.panel.estado(r.codigo);
      if (e?.estado === 'listo') listos[r.codigo] = e.resultado;
    }
    return listos;
  });

  protected readonly tarjetas = computed<TarjetaPanel[]>(() =>
    this.dominios.map((dominio) => ({
      dominio,
      estado: this.estadoTarjeta(dominio.id),
      resumen: resumenDominio(dominio.id, this.resultados(), this.corte()),
    })),
  );

  protected readonly abierto = signal<DominioPanel | null>(null);

  protected readonly dominioAbierto = computed(() => this.dominios.find((d) => d.id === this.abierto()) ?? null);

  protected readonly resumenAbierto = computed(
    () => this.tarjetas().find((t) => t.dominio.id === this.abierto())?.resumen ?? null,
  );

  protected readonly reportesAbiertos = computed(() => REPORTES_ASESOR.filter((r) => r.dominio === this.abierto()));

  protected readonly conFiltros = computed(() => this.reportesAbiertos().some((r) => r.codigo === CODIGO_EFECTIVIDADES));

  private readonly injector = inject(Injector);
  private readonly filaPestanas = viewChild<ElementRef<HTMLElement>>('filaPestanas');

  constructor() {
    // En el teléfono la fila de chips se desliza hasta el activo al abrir o cambiar de dominio.
    effect(() => {
      const fila = this.filaPestanas()?.nativeElement;
      this.abierto();
      if (fila) afterNextRender(() => requestAnimationFrame(() => centrarActiva(fila)), { injector: this.injector });
    });
  }

  /** Con el diálogo abierto, el foco va al chip activo (no al primero). */
  protected alMostrarDetalle(): void {
    const fila = this.filaPestanas()?.nativeElement;
    if (fila) centrarActiva(fila, true);
  }

  /** Abre o cambia el dominio del detalle y vuelve al inicio del contenido. */
  protected abrir(dominio: DominioPanel): void {
    this.abierto.set(dominio);
    this.filaPestanas()?.nativeElement.closest('.p-dialog')?.querySelector('.p-dialog-content')?.scrollTo?.({ top: 0 });
  }

  protected cerrar(): void {
    this.abierto.set(null);
  }

  protected estado(codigo: string) {
    return this.panel.estado(codigo);
  }

  protected bloques(reporte: ReportePanelAsesor, resultado: ResultadoPanelAsesor) {
    return bloquesDe(reporte, resultado);
  }

  protected vacio(resultado: ResultadoPanelAsesor): boolean {
    return sinDatos(resultado);
  }

  protected esPendiente(tabla: TablaReporteResultado | undefined): boolean {
    return tabla === TABLA_PENDIENTE;
  }

  protected claseTono(tono: TonoPanel | 'referencia'): string {
    return `tono-${tono}`;
  }

  protected reintentarTarjeta(dominio: DominioPanel): void {
    for (const codigo of FUENTES_DOMINIO[dominio]) {
      if (this.panel.estado(codigo)?.estado === 'error') this.panel.reintentar(codigo);
    }
  }

  private estadoTarjeta(dominio: DominioPanel): EstadoTarjeta {
    const propios = REPORTES_ASESOR.filter((r) => r.dominio === dominio).map((r) => this.panel.estado(r.codigo));
    if (propios.some((e) => !e || e.estado === 'cargando')) return 'cargando';
    if (propios.every((e) => e?.estado === 'error')) return 'error';
    const listos = propios.filter((e) => e?.estado === 'listo');
    return listos.every((e) => e?.estado === 'listo' && sinDatos(e.resultado)) ? 'vacio' : 'listo';
  }
}
