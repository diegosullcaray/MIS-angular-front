import { Component, DestroyRef, inject, input, OnInit, output, signal, effect, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, map, takeUntil } from 'rxjs';
import { identidadConsulta } from '../../utils/identidad-consulta.util';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ModSysAdminService } from '../../../core/winder/instances/mod-sys-admin.service';
import { ShellStateService } from '../../../core/services/shell-state.service';
import { fechaCorteJerarquia } from './fecha-corte.util';
import { JerarquiaCacheService } from './jerarquia-cache.service';
import type { HierarquiaNodo, JerarquiaResponseBody, NivelJerarquiaDropdown, ParamsJerarquia } from './jerarquia.model';

/** Nombre de un nivel comparable: sin tildes, en mayúsculas y con los espacios colapsados. */
function normalizarDescripcion(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toUpperCase();
}

/** Selector de jerarquía organizativa en cascada horizontal. */
@Component({
  selector: 'app-hier-selector',
  standalone: true,
  imports: [FormsModule, SelectModule, ButtonModule],
  templateUrl: './hier-selector.component.html',
})
export class HierSelectorComponent implements OnInit {
  private readonly antAdmin = inject(ModSysAdminService);
  private readonly shell = inject(ShellStateService);
  private readonly cache = inject(JerarquiaCacheService);
  private readonly cancelarCarga = new Subject<void>();
  private iniciado = false;

  private primerRunEffect = true;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.cancelarCarga.next();
      this.cancelarCarga.complete();
    });
    effect(() => {
      this.fechaPersonalizada();
      identidadConsulta(this.shell.usuarioActivo());
      
      if (this.primerRunEffect) {
        this.primerRunEffect = false;
        return;
      }

      if (untracked(() => this.iniciado)) this.limpiar();
    });
  }

  readonly paramsHier = input.required<ParamsJerarquia>();
  readonly placeholder = input('Elegir jerarquía');
  /** `true` (default): la raíz queda preseleccionada y se emite al cargar. */
  readonly autoSeleccionar = input(true);
  /** Raíz ya conocida por la pantalla; ahorra la llamada a `base_hier`. */
  readonly raizFija = input<HierarquiaNodo[] | null>(null);
  /**
   * `true` (default): la tarjeta ocupa todo el ancho de la franja de filtros, igual que
   * `app-grupo-filtros`. "Limpiar" queda junto al último nivel, no empujado al borde.
   * `false` la ajusta al contenido.
   */
  readonly anchoCompleto = input(true);
  /**
   * Si un nivel vuelve vacío con el filtro de fecha, lo reintenta sin él.
   *
   * Nació como parche en Presupuesto, cuya fecha de corte caía a HOY cuando el backend todavía
   * no había declarado la suya — y pedir el día en curso devuelve `level_hierarchy` vacío. Con
   * `fechaCorteJerarquia()` ese caso ya no debería darse, pero queda disponible como red.
   */
  readonly reintentarSinFecha = input(false);

  readonly nodoSeleccionado = output<HierarquiaNodo>();
  /** Ruta completa de la raíz al nivel elegido. */
  readonly rutaSeleccionada = output<HierarquiaNodo[]>();
  /** Solo se emite si falla o queda vacía la carga inicial (raíz o su primer nivel) — el único caso en que este componente nunca llega a emitir `nodoSeleccionado`, así el contenedor puede apagar su propio loading en vez de quedarse esperando para siempre. */
  readonly error = output<void>();

  /** Fecha opcional para forzar la consulta de la jerarquía (en lugar de la fecha global del usuario). */
  readonly fechaPersonalizada = input<string | null>(null);

  protected readonly nodosNivel = signal<NivelJerarquiaDropdown[]>([]);
  protected readonly valoresSeleccionados = signal<(HierarquiaNodo | null)[]>([]);
  protected readonly cargando = signal(false);

  ngOnInit(): void {
    this.iniciado = true;
    this.cargarRaiz();
  }

  public limpiar(): void {
    this.cancelarCarga.next();
    this.nodosNivel.set([]);
    this.valoresSeleccionados.set([]);
    this.cargarRaiz();
  }

  /**
   * Opción ya cargada cuyo nombre coincide con `texto` (sin distinguir mayúsculas, tildes ni
   * espacios de más), buscando del nivel más profundo al más alto. Sirve para el drill down de una
   * tabla cuyas filas traen el nombre del nivel pero no su `tip_cod`/`cod_rel`. Lee el estado como
   * signal, así un `computed` del contenedor se actualiza cuando llega el nivel siguiente.
   */
  public opcionPorDescripcion(texto: string): HierarquiaNodo | null {
    const buscado = normalizarDescripcion(texto);
    if (!buscado) return null;
    const niveles = this.nodosNivel();
    for (let i = niveles.length - 1; i >= 0; i--) {
      const opcion = niveles[i].data.find((o) => normalizarDescripcion(String(o.desc_rel ?? o.des_rel ?? '')) === buscado);
      if (opcion) return opcion;
    }
    return null;
  }

  /**
   * Sincroniza el cascada con un nodo elegido desde una tabla. El legacy
   * actualizaba su `hierBuffer` antes de pedir la tabla siguiente; exponer esta
   * operación evita que la pantalla consulte un nivel que el filtro no refleja.
   */
  public seleccionarNodo(nodo: HierarquiaNodo): boolean {
    const indice = this.nodosNivel().findIndex((nivel) =>
      nivel.data.some((opcion) => opcion.tip_cod === nodo.tip_cod && opcion.cod_rel === nodo.cod_rel),
    );
    if (indice < 0) return false;

    const opcion = this.nodosNivel()[indice].data.find(
      (item) => item.tip_cod === nodo.tip_cod && item.cod_rel === nodo.cod_rel,
    );
    if (!opcion) return false;

    this.onSeleccionarNivel(indice, opcion);
    return true;
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

    const codJer = this.paramsHier().code;
    this.cache
      .obtener(this.cache.claveBase(email, codJer), () =>
        this.antAdmin
          .getBaseHierarchy(email, codJer)
          .pipe(map((r) => (r.body as JerarquiaResponseBody | null)?.base_hierarchy ?? [])),
      )
      .pipe(takeUntil(this.cancelarCarga))
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
    const fechaGlobal = fechaCorteJerarquia(this.shell.usuarioActivo()?.fechaCorte);
    const fechaFiltro = this.fechaPersonalizada();
    const valFec = fechaFiltro || fechaGlobal;
    const paramsFec = { key: 'fec', val: valFec };

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

  /**
   * Una llamada a nivel de jerarquía, servida desde el caché cuando ya se pidió.
   *
   * La clave lleva la fecha de corte, así que cambiar de corte no reusa el árbol
   * del anterior.
   */
  private pedirNivel(tip_cod: number, cod_rels: string[], lvl: number, paramsFec?: { key: string; val: string }) {
    const codJer = this.paramsHier().code;
    const clave = this.cache.claveNivel(codJer, lvl, tip_cod, cod_rels, paramsFec?.val, identidadConsulta(this.shell.usuarioActivo()));
    return this.cache.obtener(clave, () =>
      this.antAdmin
        .getLevelHierarchy(codJer, lvl, tip_cod, cod_rels, paramsFec)
        .pipe(map((r) => (r.body as JerarquiaResponseBody | null)?.level_hierarchy ?? [])),
    ).pipe(takeUntil(this.cancelarCarga));
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

  /** Normaliza el nodo con descripciones unificadas. */
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
    this.cancelarCarga.next();

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
