import { Injectable, inject, signal } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModIncentivosService } from '../../../../core/winder/instances/mod-incentivos.service';
import { ModSysAdminService } from '../../../../core/winder/instances/mod-sys-admin.service';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import {
  CFG_INDIVIDUAL_SECTORISTA,
  NIVELES_SELECTOR_JERARQUIA,
  crearAvancesDefault,
  crearCalculadoraDefault,
  crearPerfilSemDefault,
  crearSuperPlusDefault,
  resolverConfiguracionUsuario,
} from '../utils/incentivos-config.util';
import { asignarValores, marcarHabilitados, marcarVisibles, sumarPorIds, resolverSituacion } from '../utils/incentivos-calculo.util';
import type {
  AsesorPickItem,
  CalculadoraConfig,
  FilaTablaEfectividad,
  FilaTablaVariable,
  ItemAvance,
  ItemSemaforo,
  ItemSuperPlus,
  MonetizadoIncentivo,
  NivelSeleccionado,
  NodoJerarquiaIncentivo,
  PerfilUsuarioIncentivo,
  ResultadoBancarizacion,
  ResultadoDetalleVariable,
} from '../models';

/** `cod_jer` de la jerarquía organizativa — mismo código que usan Presupuesto/Kaypacha para `base_hier`. */
const COD_JERARQUIA_ORGANIZATIVA = 9;

/** Modelo de campaña — fijo en `'2026'`. El legado tenía `changeModel()` para alternar con `'2025'`, pero el botón de UI que lo disparaba ya estaba comentado (`monetizado.component.html`) — evidencia de que la transición 2025→2026 ya se dio en la práctica. Ver `docs/06-legado-sistema-anterior/incentivos-auditoria.md`. */
const MODELO_CAMPANIA = '2026';

/** Forma cruda de `incentivos4.resultados4`/`.resultados5` (`resultado`). */
interface ResultadosBody {
  resultado?: {
    ds1?: FilaTablaVariable[];
    ds2?: FilaTablaEfectividad[];
    /** Mapa dinámico `${id}_avan_fix`/`${id}_avan_floor` (avances) + `pag1/pag2/pag3/tas_min/tas_met/mar_ren` (calculadora). */
    ds3?: Record<string, unknown>;
    /** Mapa dinámico `flag_<id>`/`bob_<id>`/`bop_<id>`/`bos_<id>` + `flag_act`. */
    ds4?: Record<string, unknown>;
  };
}

interface SimulacionBody {
  resultado?: Record<string, unknown> & { flag_act?: number };
}

interface ListaJerarquiaBody {
  resultado?: NodoJerarquiaIncentivo[];
}

interface AsesoresBody {
  list_res?: AsesorPickItem[];
}

interface DetalleVariableBody {
  resultado?: ResultadoDetalleVariable;
}

interface BancarizacionBody {
  resultado?: { det?: ResultadoBancarizacion['filas']; tot?: ResultadoBancarizacion['totales'] };
}

/**
 * Fachada + estado del módulo `incentivos` (Cuadro de Mando de Incentivos,
 * `/app/incentivos3`) — reemplaza a `Incentivos3Service` (legado STG,
 * `pages/modules/incentivos3/compartido/servicios/incentivos3.service.ts`),
 * traduciendo las respuestas del backend Ant a los modelos tipados del
 * módulo y manteniendo el Cuadro de Mando como estado compartido
 * (`signal`s) entre `PrincipalComponent` y los diálogos
 * (Calculadora/Detalle/Selector de Nivel).
 *
 * ## Gap de datos conocido — pendiente de negocio/backend
 *
 * El legado diferenciaba el acceso con 3 campos de `profile` que el
 * `UsuarioActivo` de este Host **no expone todavía**: `niv` (STAFF/
 * TERRITORIO/CORREDOR/ADMINISTRACION/SECTORISTA), `cla_use` (individual/
 * grupal) y `tip_use` (admin/asesor/otros) — igual gap que ya documentó
 * `PresupuestoService.esAdmin()`/`fechaCorte()` para su propio módulo. Acá
 * se resuelve así, hasta que el backend real exponga esos campos:
 * - `ShellStateService.esAdmin()` (`true`) ⇒ se trata como el STAFF del
 *   legado: ve el selector de nivel de entrada, con acceso a los 3 niveles
 *   de jerarquía + los 2 atajos "FC" (`lvlHier=4`). No se migra la opción
 *   "Mi Perfil" del selector legado (`showMe`, exclusiva de roles con perfil
 *   propio) — el modelo simplificado de acceso de este Host no distingue esa
 *   variante intermedia, y STAFF (el rol que sí se migra) tampoco la tenía.
 * - `esAdmin()` (`false`) ⇒ se trata como el SECTORISTA individual del
 *   legado: carga directo el perfil propio (`tip_cod=1`, `cla_usu=1`,
 *   `cod_rel` = `codBt` del usuario), sin botón para abrir el selector.
 *
 * `curr_fec` (fecha de corte) tampoco está expuesta — se usa la fecha real
 * como aproximación (`fechaCorte()`), igual que en `PresupuestoService`. El
 * selector de fecha del legado (`monetizado.component.html`, calendario
 * limitado a `profile.hab_fec`) no se migra: sin esa lista de fechas
 * habilitadas del backend no hay nada real que ofrecer para elegir — la
 * fecha se muestra de solo lectura.
 */
@Injectable({ providedIn: 'root' })
export class IncentivosService {
  private readonly ant = inject(ModIncentivosService);
  private readonly antAdmin = inject(ModSysAdminService);
  private readonly shell = inject(ShellStateService);

  readonly modelo = MODELO_CAMPANIA;

  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  readonly perfil = signal<PerfilUsuarioIncentivo | null>(null);
  readonly semaforo = signal<ItemSemaforo[]>(crearPerfilSemDefault());
  readonly monetizado = signal<MonetizadoIncentivo>(this.monetizadoInicial());
  readonly avances = signal<ItemAvance[]>(crearAvancesDefault());
  readonly superPlus = signal<ItemSuperPlus[]>(crearSuperPlusDefault());
  readonly tablaVariables = signal<FilaTablaVariable[]>([]);
  readonly tablaEfectividad = signal<FilaTablaEfectividad[]>([]);
  readonly calculadora = signal<CalculadoraConfig>(crearCalculadoraDefault());

  readonly nivelActual = signal<NivelSeleccionado | null>(null);
  readonly puedeElegirNivel = signal(false);
  /** `true` justo después de `iniciar()` si el usuario debe elegir un nivel antes de ver datos (equivalente admin/STAFF). */
  readonly requiereSeleccionInicial = signal(false);
  readonly nivelesSelector = NIVELES_SELECTOR_JERARQUIA;

  private raizJerarquia: { tipCod: number; codRel: string } | null = null;

  private monetizadoInicial(): MonetizadoIncentivo {
    return {
      bonoBase: 0,
      bonoPlus: 0,
      bonoSuperPlus: 0,
      bonoTotal: 0,
      codigoSituacion: 0,
      descripcionSituacion: '--',
      puedeSimular: false,
      modelo: this.modelo,
      modeloDescripcion: `M${this.modelo}`,
      mostrarModelo: false,
      fechasHabilitadas: [],
    };
  }

  private get codBt(): string | undefined {
    return this.shell.usuarioActivo()?.codBt;
  }

  private get email(): string {
    return this.shell.usuarioActivo()?.email ?? '';
  }

  /** Fecha de corte — el Host no expone `profile.curr_fec` todavía, se usa la fecha real. Formato `YYYYMMDD`, igual que el backend. */
  fechaCorte(): string {
    return new Date().toISOString().slice(0, 10).replace(/-/g, '');
  }

  /** Arranca el módulo — equivalente a `loadData()` del legado (llamar una vez al entrar a la pantalla). */
  iniciar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.perfil.set(null);
    this.nivelActual.set(null);

    const esAdmin = this.shell.esAdmin();
    this.puedeElegirNivel.set(esAdmin);
    this.monetizado.update((actual) => ({ ...actual, mostrarModelo: !esAdmin }));

    if (esAdmin) {
      this.requiereSeleccionInicial.set(true);
      this.cargando.set(false);
      this.cargarRaizJerarquia();
      return;
    }

    this.requiereSeleccionInicial.set(false);
    const codRel = this.codBt;
    if (!codRel) {
      this.error.set('No se pudo determinar tu código de negocio/agencia.');
      this.cargando.set(false);
      return;
    }
    this.seleccionarNivel({ nombre: 'Mi perfil', nivel: '--', descripcionNivel: '--', imagenUrl: '' }, { tipCod: 1, codRel, claUsu: 1 });
  }

  /** Deja el cache de jerarquía listo para el selector, sin bloquear la pantalla (equivalente a `getBaseHier()` cuando abre el chooser). */
  private cargarRaizJerarquia(): void {
    this.antAdmin.getBaseHierarchy(this.email, COD_JERARQUIA_ORGANIZATIVA).subscribe((respuesta) => {
      const h = (respuesta.body as { base_hierarchy?: { tip_cod: number; cod_rel: string }[] } | null)?.base_hierarchy;
      if (h?.[0]) {
        this.raizJerarquia = { tipCod: h[0].tip_cod, codRel: h[0].cod_rel };
      }
    });
  }

  /** Niveles listados por `incentivos3.lista3` desde la raíz de jerarquía del usuario — selector "Unidades"/"Corredores"/"Territorios". */
  obtenerNivelesJerarquia(tipCodListado: number): Observable<NodoJerarquiaIncentivo[]> {
    const raiz = this.raizJerarquia ?? { tipCod: 7, codRel: '231' };
    return this.ant
      .getFromHierList(raiz.tipCod, raiz.codRel, tipCodListado)
      .pipe(map((r) => (r.body as ListaJerarquiaBody | null)?.resultado ?? []));
  }

  /** Colaboradores listados por `list_pick_01` desde la raíz de jerarquía del usuario — selector "Asesores". */
  obtenerAsesores(): Observable<AsesorPickItem[]> {
    const raiz = this.raizJerarquia ?? { tipCod: 7, codRel: '231' };
    return this.antAdmin
      .getListPick01(raiz.tipCod, raiz.codRel)
      .pipe(map((r) => (r.body as AsesoresBody | null)?.list_res ?? []));
  }

  /** Financiera Confianza consolidada — atajos "FC Individual"/"FC Grupal" del selector de nivel (solo visibles para el nivel más alto). */
  seleccionarFinancieraConfianza(claUsu: 1 | 2): void {
    this.seleccionarNivel(
      { nombre: 'FINANCIERA CONFIANZA', nivel: 'TOTAL', descripcionNivel: 'FC', imagenUrl: 'assets/images/fc/avatars/mis_wait.png' },
      { tipCod: 7, codRel: '231', claUsu }
    );
  }

  /** Colaborador elegido en "Asesores" — arma el header del perfil y carga sus datos. */
  seleccionarAsesor(asesor: AsesorPickItem): void {
    const claUsu = asesor.cod_gru ?? 1;
    this.monetizado.update((actual) => ({ ...actual, mostrarModelo: claUsu === 1 }));
    this.seleccionarNivel(
      { nombre: asesor.des_sec, nivel: 'CARGO', descripcionNivel: asesor.des_car ?? '--', imagenUrl: asesor.pic_url ?? '' },
      { tipCod: 1, codRel: asesor.cod_sec, claUsu }
    );
  }

  /** Nodo elegido en "Unidades"/"Corredores"/"Territorios" — arma el header del perfil y carga sus datos. */
  seleccionarNodoJerarquia(nodo: NodoJerarquiaIncentivo): void {
    this.monetizado.update((actual) => ({ ...actual, mostrarModelo: false }));
    this.seleccionarNivel(
      { nombre: nodo.des_rel, nivel: nodo.tip_rel ?? '--', descripcionNivel: nodo.des_rel, imagenUrl: '' },
      { tipCod: nodo.tip_cod, codRel: nodo.cod_rel, claUsu: nodo.cod_gru ?? 1 }
    );
  }

  private seleccionarNivel(perfil: PerfilUsuarioIncentivo, nivel: NivelSeleccionado): void {
    this.perfil.set(perfil);
    this.requiereSeleccionInicial.set(false);
    this.cargarDatos(nivel);
  }

  private cargarDatos(nivel: NivelSeleccionado): void {
    this.cargando.set(true);
    this.error.set(null);
    this.nivelActual.set(nivel);

    const puedeSimular = ![20, 7].includes(nivel.tipCod);
    const cfg = resolverConfiguracionUsuario(nivel.tipCod, nivel.claUsu);
    const fec = this.fechaCorte();

    const fuente$ =
      nivel.claUsu === 2
        ? this.ant.getDataSourcesGrupal(nivel.tipCod, nivel.codRel, fec)
        : this.ant.getDataSourcesIndividual(this.modelo, nivel.tipCod, nivel.codRel, fec);

    fuente$.subscribe({
      next: (respuesta) => {
        const ds = (respuesta.body as ResultadosBody | null)?.resultado;
        if (ds) this.aplicarResultados(ds, cfg, nivel, puedeSimular);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el Cuadro de Mando.');
        this.cargando.set(false);
      },
    });
  }

  private aplicarResultados(
    ds: NonNullable<ResultadosBody['resultado']>,
    cfg: ReturnType<typeof resolverConfiguracionUsuario>,
    nivel: NivelSeleccionado,
    puedeSimular: boolean
  ): void {
    const ds3 = ds.ds3 ?? {};
    const ds4 = ds.ds4 ?? {};

    this.tablaVariables.set(ds.ds1 ?? []);
    this.tablaEfectividad.set(ds.ds2 ?? []);

    let sem = marcarVisibles(crearPerfilSemDefault(), cfg.prof);
    sem = asignarValores(sem, ds4, 'val', 'flag_', '');
    this.semaforo.set(sem);

    const flagAct = Number(ds4['flag_act'] ?? 0);
    const situacion = resolverSituacion(flagAct);

    let avances = marcarVisibles(crearAvancesDefault(), cfg.avanS);
    avances = marcarHabilitados(avances, cfg.avanE);
    avances = asignarValores(avances, ds3, 'val', '', '_avan_fix');
    avances = asignarValores(avances, ds3, 'per', '', '_avan_floor');
    this.avances.set(avances);

    let superPlus = marcarVisibles(crearSuperPlusDefault(), cfg.supS);
    superPlus = marcarHabilitados(superPlus, cfg.supE);
    superPlus = asignarValores(superPlus, ds4, 'val', 'bos_', '');
    this.superPlus.set(superPlus);

    const bonoBase = sumarPorIds(ds4, cfg.prof, 'bob_', '');
    const bonoPlus = sumarPorIds(ds4, cfg.prof, 'bop_', '');
    const bonoSuperPlus = sumarPorIds(ds4, cfg.calS, 'bos_', '');
    const bonoTotal = bonoBase + bonoPlus + bonoSuperPlus;

    this.monetizado.update((actual) => ({
      ...actual,
      bonoBase,
      bonoPlus,
      bonoSuperPlus,
      bonoTotal,
      codigoSituacion: situacion.codigo,
      descripcionSituacion: situacion.descripcion,
      puedeSimular,
    }));

    let vars = marcarVisibles(crearCalculadoraDefault().variables, cfg.prof);
    vars = asignarValores(vars, ds3, 'val', '', '_real');
    vars = asignarValores(vars, ds3, 'met', '', '_met');
    vars = asignarValores(vars, ds4, 'bob', 'bob_', '');
    vars = asignarValores(vars, ds4, 'bop', 'bop_', '');

    let plus = marcarVisibles(crearCalculadoraDefault().plus, cfg.supS);
    plus = marcarHabilitados(plus, cfg.calE);
    plus = asignarValores(plus, ds3, 'val', '', '_real');
    plus = asignarValores(plus, ds4, 'bos', 'bos_', '');

    if (nivel.claUsu === 1) {
      const idxEfec1 = vars.findIndex((v) => v.id === 'efec1' && v.show);
      if (idxEfec1 !== -1) {
        vars[idxEfec1] = {
          ...vars[idxEfec1],
          tp1: Number(ds3['pag1'] ?? 0),
          tp2: Number(ds3['pag2'] ?? 0),
          tp3: Number(ds3['pag3'] ?? 0),
        };
      }
      const idxTas = plus.findIndex((p) => p.id === 'tas' && p.show);
      if (idxTas !== -1) {
        plus[idxTas] = { ...plus[idxTas], val1: Number(ds3['tas_min'] ?? 0), met: Number(ds3['tas_met'] ?? 0) };
      }
    }

    this.calculadora.set({
      variables: vars,
      plus,
      bonoBase,
      bonoPlus,
      bonoSuperPlus,
      bonoTotal,
      activo: situacion.codigo,
      margenRenovacion: Number(ds3['mar_ren'] ?? 0),
      claseUsuario: nivel.claUsu,
    });
  }

  /** Simulación de la Calculadora — arma el payload con `tip_cod`/`cod_rel`/`mar_ren` del nivel actual y actualiza los bonos calculados. */
  simular(valores: Record<string, number>): Observable<boolean> {
    const nivel = this.nivelActual();
    const calc = this.calculadora();
    if (!nivel) throw new Error('No hay un nivel seleccionado para simular.');

    const payload = { ...valores, tip_cod: nivel.tipCod, cod_rel: nivel.codRel, mar_ren: calc.margenRenovacion };
    const fec = this.fechaCorte();

    const fuente$ = nivel.claUsu === 2 ? this.ant.calcularGrupal(payload, fec) : this.ant.calcularIndividual(this.modelo, payload, fec);

    return fuente$.pipe(
      map((respuesta) => {
        const ds = (respuesta.body as SimulacionBody | null)?.resultado;
        if (!ds) return false;

        const bonoBase = sumarPorIds(ds, CFG_INDIVIDUAL_SECTORISTA.prof, 'bob_', '');
        const bonoPlus = sumarPorIds(ds, CFG_INDIVIDUAL_SECTORISTA.prof, 'bop_', '');
        const bonoSuperPlus = sumarPorIds(ds, calc.plus.filter((p) => p.suma).map((p) => p.id), 'bos_', '');

        const variables = asignarValores(asignarValores(calc.variables, ds, 'bob', 'bob_', ''), ds, 'bop', 'bop_', '');
        const plus = asignarValores(calc.plus, ds, 'bos', 'bos_', '');

        this.calculadora.set({
          ...calc,
          variables,
          plus,
          bonoBase,
          bonoPlus,
          bonoSuperPlus,
          bonoTotal: bonoBase + bonoPlus + bonoSuperPlus,
          activo: Number(ds['flag_act'] ?? calc.activo),
        });
        return true;
      })
    );
  }

  /** Datos del diálogo de detalle de variable (Cartera/Clientes/Efectividad/Productividad/Tasas/Retención). */
  obtenerDetalleVariable(
    req: 'getDetail' | 'getTasa' | 'getProd' | 'getRetencion',
    tipCod: number,
    codRel: string,
    codVar: number
  ): Observable<ResultadoDetalleVariable | null> {
    const fec = this.fechaCorte();
    const fuente$ =
      req === 'getDetail'
        ? this.ant.getDetail(tipCod, codRel, codVar, fec)
        : req === 'getTasa'
          ? this.ant.getTasa(tipCod, codRel, fec)
          : req === 'getProd'
            ? this.ant.getProd(tipCod, codRel, fec)
            : this.ant.getRetencion(tipCod, codRel, fec);

    return fuente$.pipe(map((r) => (r.body as DetalleVariableBody | null)?.resultado ?? null));
  }

  /** Datos del diálogo de Bancarización (único consumidor de `comp:2`). */
  obtenerBancarizacion(tipCod: number, codRel: string): Observable<ResultadoBancarizacion> {
    return this.ant.getCliBanc(tipCod, codRel, this.fechaCorte()).pipe(
      map((r) => {
        const resultado = (r.body as BancarizacionBody | null)?.resultado;
        return { filas: resultado?.det ?? [], totales: resultado?.tot ?? null };
      })
    );
  }
}
