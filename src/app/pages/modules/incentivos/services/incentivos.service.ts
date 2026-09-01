import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, throwError } from 'rxjs';
import { ModIncentivosService } from '../../../../core/winder/instances/mod-incentivos.service';
import { ModSysAdminService } from '../../../../core/winder/instances/mod-sys-admin.service';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import { LoadingService } from '../../../../shared/services/loading.service';
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
import type { NivelSeleccionado, PerfilUsuarioIncentivo } from '../models/incentivos-perfil.model';
import type { FilaTablaEfectividad, FilaTablaVariable, ItemAvance, ItemSemaforo, ItemSuperPlus, MonetizadoIncentivo } from '../models/incentivos-tablas.model';
import type { CalculadoraConfig } from '../models/incentivos-calculadora.model';
import type { AsesorPickItem, NodoJerarquiaIncentivo } from '../models/incentivos-jerarquia.model';
import type { ResultadoDetalleVariable } from '../models/incentivos-detalle.model';
import type { ResultadoBancarizacion } from '../models/incentivos-bancarizacion.model';
import type { AsesoresBody, BancarizacionBody, DetalleVariableBody, ListaJerarquiaBody, ResultadosBody, SimulacionBody } from '../models/incentivos-api-response.model';
import {
  CABECERA_FINANCIERA_CONFIANZA,
  CLAVES_INCENTIVOS,
  COD_JERARQUIA_ORGANIZATIVA,
  MODELO_CAMPANIA,
} from '../constantes/incentivos.constantes';

/** Forma cruda de `incentivos4.resultados4`/`.resultados5` (`resultado`). */


/** Fachada + estado del módulo `incentivos` (Cuadro de Mando, `/app/incentivos3`). */
@Injectable({ providedIn: 'root' })
export class IncentivosService {
  private readonly ant = inject(ModIncentivosService);
  private readonly antAdmin = inject(ModSysAdminService);
  private readonly shell = inject(ShellStateService);
  private readonly loading = inject(LoadingService);

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
  /** `true` si el usuario debe elegir un nivel antes de ver datos (admin/STAFF). */
  readonly requiereSeleccionInicial = signal(false);
  readonly nivelesSelector = NIVELES_SELECTOR_JERARQUIA;

  /** Fecha (`YYYYMMDD`) de los datos actualmente mostrados — la que el usuario eligió en el selector, o la de corte por defecto. */
  readonly fechaActual = signal('');

  private raizJerarquia: { tipCod: number; codRel: string } | null = null;
  /** Override manual del selector de fecha (`seleccionarFecha`) — `null` usa la fecha de corte por defecto. */
  private fechaSeleccionada: string | null = null;

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

  /** Fecha de corte de campaña (`YYYYMMDD`) — la elegida a mano (`seleccionarFecha`) o `profile.curr_fec` del backend; si ninguna llegó todavía, aproxima con la fecha real. */
  fechaCorte(): string {
    return this.fechaSeleccionada ?? this.shell.usuarioActivo()?.fechaCorte ?? new Date().toISOString().slice(0, 10).replace(/-/g, '');
  }

  /** Vuelve a cargar el Cuadro de Mando del nivel actual a otra fecha de corte (selector de fecha del panel de Monetización). */
  seleccionarFecha(fecha: string): void {
    this.fechaSeleccionada = fecha;
    const nivel = this.nivelActual();
    if (nivel) this.cargarDatos(nivel);
  }

  /** Arranca el módulo — llamar una vez al entrar a la pantalla. */
  iniciar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.perfil.set(null);
    this.nivelActual.set(null);
    this.fechaSeleccionada = null;

    const esAdmin = this.shell.esAdmin();
    this.puedeElegirNivel.set(esAdmin);
    this.monetizado.update((actual) => ({ ...actual, mostrarModelo: !esAdmin, fechasHabilitadas: this.calcularFechasHabilitadas() }));

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

  /** Recarga el Cuadro de Mando del nivel actualmente seleccionado (botón "Actualizar"). */
  actualizar(): void {
    const nivel = this.nivelActual();
    if (nivel) this.cargarDatos(nivel);
  }

  /** Fechas de corte re-consultables (`profile.hab_fec`) más la fecha de corte vigente — selector de fecha del panel de Monetización. */
  private calcularFechasHabilitadas(): string[] {
    const usuario = this.shell.usuarioActivo();
    const habilitadas = (usuario?.fechasHabilitadas ?? '')
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean);
    if (usuario?.fechaCorte) habilitadas.push(usuario.fechaCorte);
    return [...new Set(habilitadas)].sort().reverse();
  }

  /** Carga la raíz de jerarquía para el selector de nivel, con el spinner de pantalla completa activo hasta que termine. */
  private cargarRaizJerarquia(): void {
    this.loading.show('Cargando jerarquía…');
    this.antAdmin.getBaseHierarchy(this.email, COD_JERARQUIA_ORGANIZATIVA).subscribe({
      next: (respuesta) => {
        const h = (respuesta.body as { base_hierarchy?: { tip_cod: number; cod_rel: string }[] } | null)?.base_hierarchy;
        if (h?.[0]) {
          this.raizJerarquia = { tipCod: h[0].tip_cod, codRel: h[0].cod_rel };
        } else {
          this.error.set('No se pudo determinar tu jerarquía base.');
        }
        this.loading.hide();
      },
      error: () => {
        this.error.set('No se pudo determinar tu jerarquía base.');
        this.loading.hide();
      },
    });
  }

  /** Niveles listados por `incentivos3.lista3` desde la raíz de jerarquía del usuario — selector "Unidades"/"Corredores"/"Territorios". */
  obtenerNivelesJerarquia(tipCodListado: number): Observable<NodoJerarquiaIncentivo[]> {
    if (!this.raizJerarquia) return throwError(() => new Error('La jerarquía base todavía no está lista.'));
    const raiz = this.raizJerarquia;
    return this.ant
      .getFromHierList(raiz.tipCod, raiz.codRel, tipCodListado)
      .pipe(map((r) => (r.body as ListaJerarquiaBody | null)?.resultado ?? []));
  }

  /** Colaboradores listados por `list_pick_01` desde la raíz de jerarquía del usuario — selector "Asesores". */
  obtenerAsesores(): Observable<AsesorPickItem[]> {
    if (!this.raizJerarquia) return throwError(() => new Error('La jerarquía base todavía no está lista.'));
    const raiz = this.raizJerarquia;
    return this.antAdmin
      .getListPick01(raiz.tipCod, raiz.codRel)
      .pipe(map((r) => (r.body as AsesoresBody | null)?.list_res ?? []));
  }

  /** Financiera Confianza consolidada — atajos "FC Individual"/"FC Grupal" del selector de nivel (solo visibles para el nivel más alto). */
  seleccionarFinancieraConfianza(claUsu: 1 | 2): void {
    this.seleccionarNivel(
      CABECERA_FINANCIERA_CONFIANZA,
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
    this.fechaActual.set(fec);

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
    sem = asignarValores(sem, ds4, 'val', CLAVES_INCENTIVOS.flag, '');
    this.semaforo.set(sem);

    const flagAct = Number(ds4[CLAVES_INCENTIVOS.flagActivo] ?? 0);
    const situacion = resolverSituacion(flagAct);

    let avances = marcarVisibles(crearAvancesDefault(), cfg.avanS);
    avances = marcarHabilitados(avances, cfg.avanE);
    avances = asignarValores(avances, ds3, 'val', '', CLAVES_INCENTIVOS.sufijoAvance);
    avances = asignarValores(avances, ds3, 'per', '', CLAVES_INCENTIVOS.sufijoAvancePorcentaje);
    this.avances.set(avances);

    let superPlus = marcarVisibles(crearSuperPlusDefault(), cfg.supS);
    superPlus = marcarHabilitados(superPlus, cfg.supE);
    superPlus = asignarValores(superPlus, ds4, 'val', CLAVES_INCENTIVOS.bonoSuperPlus, '');
    this.superPlus.set(superPlus);

    const bonoBase = sumarPorIds(ds4, cfg.prof, CLAVES_INCENTIVOS.bonoBase, '');
    const bonoPlus = sumarPorIds(ds4, cfg.prof, CLAVES_INCENTIVOS.bonoPlus, '');
    const bonoSuperPlus = sumarPorIds(ds4, cfg.calS, CLAVES_INCENTIVOS.bonoSuperPlus, '');
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
    vars = asignarValores(vars, ds3, 'val', '', CLAVES_INCENTIVOS.sufijoReal);
    vars = asignarValores(vars, ds3, 'met', '', CLAVES_INCENTIVOS.sufijoMeta);
    vars = asignarValores(vars, ds4, 'bob', CLAVES_INCENTIVOS.bonoBase, '');
    vars = asignarValores(vars, ds4, 'bop', CLAVES_INCENTIVOS.bonoPlus, '');

    let plus = marcarVisibles(crearCalculadoraDefault().plus, cfg.supS);
    plus = marcarHabilitados(plus, cfg.calE);
    plus = asignarValores(plus, ds3, 'val', '', CLAVES_INCENTIVOS.sufijoReal);
    plus = asignarValores(plus, ds4, 'bos', CLAVES_INCENTIVOS.bonoSuperPlus, '');

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

        const bonoBase = sumarPorIds(ds, CFG_INDIVIDUAL_SECTORISTA.prof, CLAVES_INCENTIVOS.bonoBase, '');
        const bonoPlus = sumarPorIds(ds, CFG_INDIVIDUAL_SECTORISTA.prof, CLAVES_INCENTIVOS.bonoPlus, '');
        const bonoSuperPlus = sumarPorIds(ds, calc.plus.filter((p) => p.suma).map((p) => p.id), CLAVES_INCENTIVOS.bonoSuperPlus, '');

        const variables = asignarValores(asignarValores(calc.variables, ds, 'bob', CLAVES_INCENTIVOS.bonoBase, ''), ds, 'bop', CLAVES_INCENTIVOS.bonoPlus, '');
        const plus = asignarValores(calc.plus, ds, 'bos', CLAVES_INCENTIVOS.bonoSuperPlus, '');

        this.calculadora.set({
          ...calc,
          variables,
          plus,
          bonoBase,
          bonoPlus,
          bonoSuperPlus,
          bonoTotal: bonoBase + bonoPlus + bonoSuperPlus,
          activo: Number(ds[CLAVES_INCENTIVOS.flagActivo] ?? calc.activo),
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
