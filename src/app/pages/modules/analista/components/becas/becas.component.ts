import { Component, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { ListSkeletonComponent } from '../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { InlineErrorComponent } from '../../../../../shared/ui/inline-error/inline-error.component';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import { ToastService } from '../../../../../shared/services/toast.service';
import { SelectorColaboradorDialogComponent } from '../../ui/selector-colaborador-dialog/selector-colaborador-dialog.component';
import { DetalleTablaDialogComponent } from '../../ui/detalle-tabla-dialog/detalle-tabla-dialog.component';
import { AnalistaService } from '../../services/analista.service';
import type { ColaboradorItem, FilaBeca, FilaLabelValor, NodoJerarquiaAncla } from '../../models';

/**
 * Becas Financiera Confianza (`/app/analista/listas/becas`) — migrado de
 * `BecasComponent` (legado STG, `docs/07-modulos/analista/listas/becas`).
 * Lista de clientes postulantes a prospectar para becas; un click en una
 * fila la selecciona, habilitando "Prospectar" (si no está prospectada) y
 * "Detalle".
 *
 * El legado abría un diálogo de confirmación y, tras confirmar, uno de
 * formulario aparte solo para el comentario — acá es un único diálogo con
 * el comentario y los botones Cancelar/Confirmar, mismo resultado con un
 * paso menos.
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
    ListSkeletonComponent,
    InlineErrorComponent,
    EmptyStateComponent,
    SelectorColaboradorDialogComponent,
    DetalleTablaDialogComponent,
  ],
  templateUrl: './becas.component.html',
  styleUrl: './becas.component.css',
})
export class BecasComponent implements OnInit {
  private readonly analista = inject(AnalistaService);
  private readonly toast = inject(ToastService);

  protected readonly esAdmin = computed(() => this.analista.esAdmin());
  protected readonly colaborador = this.analista.colaboradorActivo;

  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly filas = signal<FilaBeca[]>([]);
  protected readonly filaSeleccionada = signal<FilaBeca | null>(null);

  protected readonly dialogColaboradorAbierto = signal(false);
  protected readonly colaboradores = signal<ColaboradorItem[]>([]);
  protected readonly cargandoColaboradores = signal(false);

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

  private readonly ancla = signal<NodoJerarquiaAncla | null>(null);
  private readonly cargandoAncla = signal(false);

  constructor() {
    effect(() => {
      const c = this.colaborador();
      if (c) untracked(() => this.cargar(c.codBt));
    });

    // Dispara la carga de colaboradores en cuanto el diálogo esté abierto Y
    // el nodo ancla haya terminado de resolverse — antes se intentaba una
    // sola vez al abrir el diálogo (`abrirSelectorColaborador`), así que si
    // el admin hacía click antes de que `obtenerAnclaAdmin()` respondiera,
    // el diálogo quedaba vacío para siempre (sin spinner ni reintento).
    effect(() => {
      const abierto = this.dialogColaboradorAbierto();
      if (!abierto || this.colaboradores().length > 0) return;
      if (this.cargandoAncla()) return;

      const ancla = this.ancla();
      if (!ancla) {
        untracked(() => this.cargandoColaboradores.set(false));
        return;
      }
      untracked(() => this.cargarColaboradores(ancla));
    });
  }

  ngOnInit(): void {
    if (this.esAdmin()) {
      this.cargandoAncla.set(true);
      this.analista.obtenerAnclaAdmin().subscribe({
        next: (ancla) => {
          this.ancla.set(ancla);
          this.cargandoAncla.set(false);
        },
        error: () => this.cargandoAncla.set(false),
      });
    } else {
      this.analista.usarColaboradorPropio();
    }
  }

  protected abrirSelectorColaborador(): void {
    this.dialogColaboradorAbierto.set(true);
    if (this.colaboradores().length === 0) this.cargandoColaboradores.set(true);
  }

  private cargarColaboradores(ancla: NodoJerarquiaAncla): void {
    this.analista.obtenerColaboradores(ancla.tip_cod, ancla.cod_rel).subscribe({
      next: (lista) => {
        this.colaboradores.set(lista);
        this.cargandoColaboradores.set(false);
      },
      error: () => this.cargandoColaboradores.set(false),
    });
  }

  protected onColaboradorSeleccionado(item: ColaboradorItem): void {
    this.analista.establecerColaborador(item);
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
