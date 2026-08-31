import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { map } from 'rxjs';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ModSysAdminService } from '../../../core/winder/instances/mod-sys-admin.service';
import { ShellStateService } from '../../../core/services/shell-state.service';
import { fechaCorteJerarquia } from './fecha-corte.util';
import type { HierarquiaNodo, JerarquiaResponseBody, NivelJerarquiaDropdown, ParamsJerarquia } from './jerarquia.model';

/**
 * Selector de jerarquía organizativa en cascada horizontal, mediante un `p-select` por nivel
 * traído del backend.
 *
 * Es el equivalente del `hier-rem-selector` del legado STG, que era **uno solo** para todo el
 * sistema: Reportes y Presupuesto lo configuraban igual (`confHier` con `roots`, `cod_hier`,
 * `params_hier`, `max_lvl`) y pegaban a las mismas dos llamadas de `admin`
 * (`base_hier` / `level_hier`). Al migrarse cada módulo por separado quedaron dos copias que
 * divergieron; ésta las reunifica y ofrece como opt-in lo que cada una había agregado.
 */
@Component({
  selector: 'app-hier-selector',
  standalone: true,
  imports: [FormsModule, SelectModule, ButtonModule],
  templateUrl: './hier-selector.component.html',
})
export class HierSelectorComponent implements OnInit {
  private readonly antAdmin = inject(ModSysAdminService);
  private readonly shell = inject(ShellStateService);

  readonly paramsHier = input.required<ParamsJerarquia>();
  readonly placeholder = input('Elegir jerarquía');
  /** `true` (default): la raíz queda preseleccionada y se emite al cargar. */
  readonly autoSeleccionar = input(true);
  /** Raíz ya conocida por la pantalla; ahorra la llamada a `base_hier`. */
  readonly raizFija = input<HierarquiaNodo[] | null>(null);
  /** Ocupa todo el ancho y empuja "Limpiar" a la derecha, en vez de ajustarse al contenido. */
  readonly anchoCompleto = input(false);
  /**
   * Si un nivel vuelve vacío con el filtro de fecha, lo reintenta sin él.
   *
   * Nació como parche en Presupuesto, cuya fecha de corte caía a HOY cuando el backend todavía
   * no había declarado la suya — y pedir el día en curso devuelve `level_hierarchy` vacío. Con
   * `fechaCorteJerarquia()` ese caso ya no debería darse, pero queda disponible como red.
   */
  readonly reintentarSinFecha = input(false);

  readonly nodoSeleccionado = output<HierarquiaNodo>();
  /** Ruta completa de la raíz al nivel elegido — el array que emitía `hier-rem-selector`. */
  readonly rutaSeleccionada = output<HierarquiaNodo[]>();
  /** Solo se emite si falla o queda vacía la carga inicial (raíz o su primer nivel) — el único caso en que este componente nunca llega a emitir `nodoSeleccionado`, así el contenedor puede apagar su propio loading en vez de quedarse esperando para siempre. */
  readonly error = output<void>();

  protected readonly nodosNivel = signal<NivelJerarquiaDropdown[]>([]);
  protected readonly valoresSeleccionados = signal<(HierarquiaNodo | null)[]>([]);
  protected readonly cargando = signal(false);

  ngOnInit(): void {
    this.cargarRaiz();
  }

  public limpiar(): void {
    this.nodosNivel.set([]);
    this.valoresSeleccionados.set([]);
    this.cargarRaiz();
  }

  private cargarRaiz(): void {
    const raizFija = this.raizFija();
    if (raizFija && raizFija.length > 0) {
      const root = raizFija[0];
      this.cargarNivel(root.tip_cod, raizFija.map((n) => n.cod_rel), root.lvl ?? 1, true);
      return;
    }

    this.cargando.set(true);
    const email = this.shell.usuarioActivo()?.email ?? '';

    this.antAdmin
      .getBaseHierarchy(email, this.paramsHier().code)
      .pipe(map((r) => (r.body as JerarquiaResponseBody | null)?.base_hierarchy ?? []))
      .subscribe({
        next: (raiz) => {
          if (raiz && raiz.length > 0) {
            // La primera llamada a `level_hier` pide el propio nivel de la raíz
            // (`lvl = root.lvl`): devuelve la raíz hidratada con `des_rel`/`lbl_hier`,
            // no sus hijos.
            const root = raiz[0];
            this.cargarNivel(root.tip_cod, [root.cod_rel], root.lvl ?? 1, true);
          } else {
            this.cargando.set(false);
            this.error.emit();
          }
        },
        error: () => {
          this.cargando.set(false);
          this.error.emit();
        },
      });
  }

  private cargarNivel(tip_cod: number, cod_rels: string[], lvl: number, esCargaInicial = false): void {
    this.cargando.set(true);
    const paramsFec = { key: 'fec', val: fechaCorteJerarquia(this.shell.usuarioActivo()?.fechaCorte) };

    this.pedirNivel(tip_cod, cod_rels, lvl, paramsFec).subscribe({
      next: (lh) => {
        // Un nivel vacío con filtro de fecha se reintenta sin él, si la pantalla lo pidió.
        if ((!lh || lh.length === 0) && this.reintentarSinFecha()) {
          this.pedirNivel(tip_cod, cod_rels, lvl).subscribe({
            next: (sinFec) => this.recibirNivel(sinFec, lvl, esCargaInicial),
            error: () => this.fallarNivel(esCargaInicial),
          });
          return;
        }
        this.recibirNivel(lh, lvl, esCargaInicial);
      },
      error: () => {
        if (this.reintentarSinFecha()) {
          this.pedirNivel(tip_cod, cod_rels, lvl).subscribe({
            next: (sinFec) => this.recibirNivel(sinFec, lvl, esCargaInicial),
            error: () => this.fallarNivel(esCargaInicial),
          });
          return;
        }
        this.fallarNivel(esCargaInicial);
      },
    });
  }

  /** Una llamada a `level_hier`, con o sin el filtro de fecha. */
  private pedirNivel(tip_cod: number, cod_rels: string[], lvl: number, paramsFec?: { key: string; val: string }) {
    return this.antAdmin
      .getLevelHierarchy(this.paramsHier().code, lvl, tip_cod, cod_rels, paramsFec)
      .pipe(map((r) => (r.body as JerarquiaResponseBody | null)?.level_hierarchy ?? []));
  }

  private fallarNivel(esCargaInicial: boolean): void {
    this.cargando.set(false);
    if (esCargaInicial) this.error.emit();
  }

  /** Procesa un nivel ya recibido: normaliza los nodos y lo agrega al cascada. */
  private recibirNivel(lh: HierarquiaNodo[], lvl: number, esCargaInicial: boolean): void {
    this.cargando.set(false);
    if (!lh || lh.length === 0) {
      if (esCargaInicial) this.error.emit();
      return;
    }

    const dataNormalizada = lh.map((nodo) => this.normalizarNodo(nodo, lvl));
    const primerNodo = dataNormalizada[0];
    const crudo = lh[0] as HierarquiaNodo;
    const labelNivel = crudo.lbl_hier || (crudo['lbl_node'] as string | undefined) || `Nivel ${lvl}`;
    const dp: NivelJerarquiaDropdown = { label: labelNivel, level: lvl, data: dataNormalizada };

    if (!esCargaInicial) {
      this.nodosNivel.set([...this.nodosNivel(), dp]);
      return;
    }

    this.nodosNivel.set([dp]);
    // La raíz se fija siempre como punto de partida, pero solo se emite (y por lo tanto se
    // consulta) cuando la pantalla pidió autoselección.
    this.valoresSeleccionados.set([primerNodo]);
    if (this.autoSeleccionar()) this.nodoSeleccionado.emit(primerNodo);
    // La ruta sí se emite siempre: una pantalla que espera N niveles necesita saber que volvió
    // a quedar en 1 (ej. tras "Limpiar") para vaciar su tabla.
    this.rutaSeleccionada.emit([primerNodo]);

    const proximoNivel = (primerNodo.lvl ?? lvl) + 1;
    if (proximoNivel <= this.paramsHier().maxLvl) {
      this.cargarNivel(primerNodo.tip_cod, [primerNodo.cod_rel], proximoNivel, false);
    }
  }

  /** El backend rotula el nodo con una clave distinta según la jerarquía; se unifica en `des_rel`/`desc_rel`. */
  private normalizarNodo(nodo: HierarquiaNodo, nivel: number): HierarquiaNodo {
    const etiqueta =
      nodo.des_rel ||
      nodo.desc_rel ||
      (nodo['lbl_node'] as string | undefined) ||
      nodo.lbl_hier ||
      (nodo['desc'] as string | undefined) ||
      (nodo['nom'] as string | undefined) ||
      (nodo['label'] as string | undefined) ||
      (nodo['name'] as string | undefined) ||
      nodo.cod_rel;
    const texto = String(etiqueta ?? '').trim();

    return { ...nodo, des_rel: texto, desc_rel: texto, lvl: nodo.lvl ?? nodo.lvl_hier ?? nivel };
  }

  protected onSeleccionarNivel(index: number, val: HierarquiaNodo | null): void {
    if (!val) return;

    const nuevosNodos = this.nodosNivel().slice(0, index + 1);
    const nuevosValores = this.valoresSeleccionados().slice(0, index);
    nuevosValores[index] = val;

    this.nodosNivel.set(nuevosNodos);
    this.valoresSeleccionados.set(nuevosValores);

    this.nodoSeleccionado.emit(val);
    this.rutaSeleccionada.emit(nuevosValores.filter((n): n is HierarquiaNodo => n !== null));

    const proximoNivel = (val.lvl ?? index + 1) + 1;
    if (proximoNivel <= this.paramsHier().maxLvl) {
      this.cargarNivel(val.tip_cod, [val.cod_rel], proximoNivel, false);
    }
  }
}
