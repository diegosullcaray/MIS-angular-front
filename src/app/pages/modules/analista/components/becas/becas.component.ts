import { Component, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { WindowPanelComponent } from '../../../../../shared/ui/window-panel/window-panel.component';
import { ListSkeletonComponent } from '../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { InlineErrorComponent } from '../../../../../shared/ui/inline-error/inline-error.component';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import { ToastService } from '../../../../../shared/services/toast.service';
import { SelectorColaboradorDialogComponent } from '../../ui/selector-colaborador-dialog/selector-colaborador-dialog.component';
import { DetalleTablaDialogComponent } from '../../ui/detalle-tabla-dialog/detalle-tabla-dialog.component';
import { AnalistaService } from '../../services/analista.service';
import { crearSelectorColaborador } from '../../utils/colaborador-selector.util';
import type { ColaboradorItem } from '../../models/colaborador.model';
import type { FilaLabelValor } from '../../models/comun.model';
import type { FilaBeca } from '../../models/listas.model';

/**
 * Becas Financiera Confianza (`/app/analista/listas/becas`) — lista de
 * postulantes a prospectar; seleccionar una fila habilita "Prospectar" (si
 * no está prospectada) y "Detalle". Migrado de `BecasComponent` (legado
 * STG): el legado usaba dos diálogos (confirmación + formulario de
 * comentario); acá es uno solo con ambos controles.
 */
@Component({
  selector: 'app-becas-analista',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    TableModule,
    DialogModule,
    TextareaModule,
    TagModule,
    TooltipModule,
    ListSkeletonComponent,
    InlineErrorComponent,
    EmptyStateComponent,
    SelectorColaboradorDialogComponent,
    WindowPanelComponent,
    DetalleTablaDialogComponent,
  ],
  templateUrl: './becas.component.html',
  styleUrl: './becas.component.css',
})
export class BecasComponent implements OnInit {
  private readonly analista = inject(AnalistaService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly selectorColaborador = crearSelectorColaborador(this.analista);
  protected readonly esAdmin = this.selectorColaborador.esAdmin;
  protected readonly colaborador = this.selectorColaborador.colaboradorActivo;
  protected readonly dialogColaboradorAbierto = this.selectorColaborador.dialogAbierto;
  protected readonly colaboradores = this.selectorColaborador.colaboradores;
  protected readonly cargandoColaboradores = this.selectorColaborador.cargando;

  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly filas = signal<FilaBeca[]>([]);
  protected readonly filaSeleccionada = signal<FilaBeca | null>(null);

  protected readonly dialogProspectarAbierto = signal(false);
  protected readonly comentario = signal('');
  protected readonly prospectando = signal(false);

  protected readonly dialogDetalleAbierto = signal(false);
  protected readonly detalleFilas = computed<FilaLabelValor[]>(() => {
    const f = this.filaSeleccionada();
    if (!f) return [];
    return [
      { lab: 'Cliente', val: f.des_cli },
      { lab: 'Estado', val: f.des_pro ?? '' },
      { lab: 'Segmento', val: f.seg_cli },
      { lab: 'Usuario', val: f.ori_sec ?? '' },
      { lab: 'Fecha', val: f.fec_pro ?? '' },
      { lab: 'Comentario', val: f.com_pro ?? '' },
    ];
  });

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

  protected seleccionarFila(fila: FilaBeca | FilaBeca[] | undefined): void {
    if (fila && !Array.isArray(fila)) this.filaSeleccionada.set(fila);
  }

  protected abrirProspectar(): void {
    this.comentario.set('');
    this.dialogProspectarAbierto.set(true);
  }

  protected confirmarProspectar(): void {
    const fila = this.filaSeleccionada();
    const c = this.colaborador();
    if (!fila || !c) return;

    this.prospectando.set(true);
    this.analista.prospectarBeca(c.codBt, fila.num_doc, this.comentario()).subscribe({
      next: (resultado) => {
        this.prospectando.set(false);
        this.dialogProspectarAbierto.set(false);

        if (!resultado.exito) {
          this.toast.error('No se pudo prospectar', 'Inténtalo de nuevo en unos segundos.');
          return;
        }

        fila.ind_pro = 1;
        fila.com_pro = this.comentario();
        fila.fec_pro = resultado.fecPro;
        fila.ori_sec = c.codBt;
        this.filas.set([...this.filas()]);
        this.toast.exito('Prospectado', `${fila.des_cli} quedó marcado como prospectado.`);
      },
      error: () => {
        this.prospectando.set(false);
        this.toast.error('No se pudo prospectar', 'Inténtalo de nuevo en unos segundos.');
      },
    });
  }

  protected volver(): void {
    this.router.navigate(['/app/analista/listas']);
  }

  protected abrirDetalle(): void {
    this.dialogDetalleAbierto.set(true);
  }

  protected reintentar(): void {
    const c = this.colaborador();
    if (c) this.cargar(c.codBt);
  }

  private cargar(codBt: string): void {
    this.cargando.set(true);
    this.error.set(null);
    this.filaSeleccionada.set(null);

    this.analista.obtenerListaBecas(codBt).subscribe({
      next: (filas) => {
        this.filas.set(filas);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la lista de becas. Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}
