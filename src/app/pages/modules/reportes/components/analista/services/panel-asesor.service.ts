import { DestroyRef, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import type { Subscription } from 'rxjs';
import { ShellStateService } from '../../../../../../core/services/shell-state.service';
import { AsesorSecService } from './asesor-sec.service';
import { PanelAsesorConsultasService } from './panel-asesor-consultas.service';
import { FILTROS_MONITOR_EFECTIVIDADES_POR_DEFECTO, type FiltrosMonitorEfectividades } from '../models/monitor-efectividades.model';
import type { AsesorSec } from '../models/asesor-sec.model';
import type { EstadoConsultaPanel, VistaPanelAsesor } from '../models/panel-asesor.model';
import { CODIGO_EFECTIVIDADES, CODIGOS_RESUMEN_ASESOR, REPORTES_ASESOR } from '../constantes/panel-asesor.constantes';

const ERROR_CONSULTA = 'No se pudo cargar el reporte. Reintenta la consulta.';

/**
 * Estado del panel unificado del asesor.
 *
 * Cada reporte se consulta una sola vez por asesor (y por filtros, en efectividades):
 * cambiar de pestaña no vuelve a pedir lo ya traído. Cambiar de asesor, de usuario o
 * pulsar "Actualizar" cancela lo pendiente y descarta lo anterior.
 */
@Injectable()
export class PanelAsesorService {
  private readonly shell = inject(ShellStateService);
  private readonly selector = inject(AsesorSecService);
  private readonly consultas = inject(PanelAsesorConsultasService);

  private readonly revision = signal(0);
  private readonly revisionLista = signal(0);
  private readonly _asesores = signal<AsesorSec[]>([]);
  private readonly _asesor = signal<AsesorSec | null>(null);
  private readonly _vista = signal<VistaPanelAsesor>('resumen');
  private readonly _filtros = signal<FiltrosMonitorEfectividades>({ ...FILTROS_MONITOR_EFECTIVIDADES_POR_DEFECTO });
  private readonly _estados = signal<Readonly<Record<string, EstadoConsultaPanel>>>({});
  private readonly _errorLista = signal<string | null>(null);
  private readonly _cargandoLista = signal(false);

  private readonly suscripciones = new Map<string, Subscription>();
  private contexto: readonly unknown[] = [];

  readonly asesores = this._asesores.asReadonly();
  readonly asesor = this._asesor.asReadonly();
  readonly vista = this._vista.asReadonly();
  readonly filtros = this._filtros.asReadonly();
  readonly errorLista = this._errorLista.asReadonly();
  readonly cargandoLista = this._cargandoLista.asReadonly();
  readonly propio = computed(() => this.shell.usuarioActivo()?.tipoUsuario === 1);
  readonly consultando = computed(() => Object.values(this._estados()).some((e) => e.estado === 'cargando'));

  constructor() {
    inject(DestroyRef).onDestroy(() => this.cancelarTodo());

    effect((onCleanup) => {
      const usuario = this.shell.usuarioActivo();
      this.revisionLista();
      this._asesores.set([]);
      this._asesor.set(null);
      this._errorLista.set(null);
      this._cargandoLista.set(false);
      if (!usuario) return;
      if (usuario.tipoUsuario === 1) {
        if (usuario.numDoc) this._asesor.set({ nombre: usuario.nombre, dni: usuario.numDoc });
        else this._errorLista.set('Tu perfil no tiene un documento de asesor. Vuelve a iniciar sesión.');
        return;
      }
      this._cargandoLista.set(true);
      const sub = untracked(() =>
        this.selector.obtenerAsesores().subscribe({
          next: (lista) => {
            this._asesores.set(lista);
            this._cargandoLista.set(false);
          },
          error: () => {
            this._errorLista.set('No se pudo cargar la lista de asesores.');
            this._cargandoLista.set(false);
          },
        }),
      );
      onCleanup(() => sub.unsubscribe());
    });

    effect(() => {
      // Identidad, asesor y revisión definen el contexto: si cambia, lo anterior ya no vale.
      const contexto = [this.shell.usuarioActivo(), this._asesor(), this.revision()];
      const vista = this._vista();
      this._filtros();
      untracked(() => {
        if (contexto.some((v, i) => v !== this.contexto[i])) {
          this.contexto = contexto;
          this.cancelarTodo();
          this._estados.set({});
        }
        if (!this._asesor()) return;
        for (const codigo of CODIGOS_RESUMEN_ASESOR) this.asegurar(codigo);
        if (vista !== 'resumen') this.asegurar(vista);
      });
    });
  }

  /** Estado de un reporte para el asesor actual (y los filtros vigentes, si aplica). */
  estado(codigo: string): EstadoConsultaPanel | null {
    return this._estados()[this.clave(codigo)] ?? null;
  }

  seleccionarAsesor(asesor: AsesorSec | null): void {
    if (this.propio()) return;
    this._asesor.set(this.asesores().find((a) => a.dni === asesor?.dni) ?? null);
  }

  seleccionarVista(vista: VistaPanelAsesor): void {
    if (vista === 'resumen' || REPORTES_ASESOR.some((r) => r.codigo === vista)) this._vista.set(vista);
  }

  filtrar(campo: keyof FiltrosMonitorEfectividades, valor: string): void {
    this._filtros.update((f) => ({ ...f, [campo]: valor }));
  }

  reintentar(codigo: string): void {
    const clave = this.clave(codigo);
    this.suscripciones.get(clave)?.unsubscribe();
    this.lanzar(codigo, clave);
  }

  actualizar(): void {
    this.revision.update((v) => v + 1);
  }

  recargarAsesores(): void {
    this.revisionLista.update((v) => v + 1);
  }

  private clave(codigo: string): string {
    return codigo === CODIGO_EFECTIVIDADES ? `${codigo}|${JSON.stringify(this._filtros())}` : codigo;
  }

  private asegurar(codigo: string): void {
    const clave = this.clave(codigo);
    if (!this._estados()[clave]) this.lanzar(codigo, clave);
  }

  private lanzar(codigo: string, clave: string): void {
    const asesor = this._asesor();
    if (!asesor) return;
    const fijar = (estado: EstadoConsultaPanel) => this._estados.update((e) => ({ ...e, [clave]: estado }));
    fijar({ estado: 'cargando' });
    const sub = this.consultas.consultar(codigo, asesor.dni, this._filtros()).subscribe({
      next: (resultado) => fijar({ estado: 'listo', resultado }),
      error: () => fijar({ estado: 'error', mensaje: ERROR_CONSULTA }),
    });
    this.suscripciones.set(clave, sub);
  }

  private cancelarTodo(): void {
    for (const sub of this.suscripciones.values()) sub.unsubscribe();
    this.suscripciones.clear();
  }
}
