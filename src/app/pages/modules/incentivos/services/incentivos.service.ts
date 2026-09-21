import { mapearResultadosIncentivos } from '../utils/incentivos-resultados.util';
import { DestroyRef, Injectable, effect, inject, signal, untracked } from '@angular/core';
import { Observable, Subscription, finalize, map, throwError } from 'rxjs';
import { identidadConsulta } from '../../../../shared/utils/identidad-consulta.util';
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
import { aNumeroIncentivo, asignarValores, sumarPorIds } from '../utils/incentivos-calculo.util';
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

/** Fachada + estado del módulo `incentivos` (Cuadro de Mando, `/app/incentivos3`). */
@Injectable({ providedIn: 'root' })
export class IncentivosService {
  private readonly ant = inject(ModIncentivosService);
  private readonly antAdmin = inject(ModSysAdminService);
  private readonly shell = inject(ShellStateService);
  private readonly loading = inject(LoadingService);

  readonly modelo = MODELO_CAMPANIA;

  private readonly cargandoState = signal(true);
  readonly cargando = this.cargandoState.asReadonly();
  private readonly errorState = signal<string | null>(null);
  readonly error = this.errorState.asReadonly();

  private readonly perfilState = signal<PerfilUsuarioIncentivo | null>(null);
  readonly perfil = this.perfilState.asReadonly();
  private readonly semaforoState = signal<ItemSemaforo[]>(crearPerfilSemDefault());
  readonly semaforo = this.semaforoState.asReadonly();
  private readonly monetizadoState = signal<MonetizadoIncentivo>(this.monetizadoInicial());
  readonly monetizado = this.monetizadoState.asReadonly();
  private readonly avancesState = signal<ItemAvance[]>(crearAvancesDefault());
  readonly avances = this.avancesState.asReadonly();
  private readonly superPlusState = signal<ItemSuperPlus[]>(crearSuperPlusDefault());
  readonly superPlus = this.superPlusState.asReadonly();
  private readonly tablaVariablesState = signal<FilaTablaVariable[]>([]);
  readonly tablaVariables = this.tablaVariablesState.asReadonly();
  private readonly tablaEfectividadState = signal<FilaTablaEfectividad[]>([]);
  readonly tablaEfectividad = this.tablaEfectividadState.asReadonly();
  private readonly calculadoraState = signal<CalculadoraConfig>(crearCalculadoraDefault());
  readonly calculadora = this.calculadoraState.asReadonly();

  private readonly nivelActualState = signal<NivelSeleccionado | null>(null);
  readonly nivelActual = this.nivelActualState.asReadonly();
  private readonly puedeElegirNivelState = signal(false);
  readonly puedeElegirNivel = this.puedeElegirNivelState.asReadonly();
  /** `true` si el usuario debe elegir un nivel antes de ver datos (admin/STAFF). */
  private readonly requiereSeleccionInicialState = signal(false);
  readonly requiereSeleccionInicial = this.requiereSeleccionInicialState.asReadonly();
  readonly nivelesSelector = NIVELES_SELECTOR_JERARQUIA;

  /** Fecha YYYYMMDD de los datos mostrados. */
  private readonly fechaActualState = signal('');
  readonly fechaActual = this.fechaActualState.asReadonly();

  private raizJerarquia: { tipCod: number; codRel: string } | null = null;
  /** Override manual del selector de fecha (`seleccionarFecha`) — `null` usa la fecha de corte por defecto. */
  private fechaSeleccionada: string | null = null;
  private consultaDatos?: Subscription;
  private consultaRaiz?: Subscription;
  private identidad = '';
  private revisionConsulta = 0;

  constructor() {
    effect(() => {
      const clave = identidadConsulta(this.shell.usuarioActivo());
      untracked(() => {
        if (clave === this.identidad) return;
        this.identidad = clave;
        this.limpiar();
      });
    });
    inject(DestroyRef).onDestroy(() => this.limpiar());
  }

  /** La pantalla y sus diálogos comparten la fachada; al salir se libera su estado. */
  limpiar(): void {
    this.consultaDatos?.unsubscribe();
    this.consultaRaiz?.unsubscribe();
    this.revisionConsulta++;
    this.raizJerarquia = null;
    this.fechaSeleccionada = null;
    this.fechaActualState.set('');
    this.nivelActualState.set(null);
    this.perfilState.set(null);
    this.errorState.set(null);
    this.cargandoState.set(false);
    this.puedeElegirNivelState.set(false);
    this.requiereSeleccionInicialState.set(false);
    this.semaforoState.set(crearPerfilSemDefault());
    this.monetizadoState.set(this.monetizadoInicial());
    this.avancesState.set(crearAvancesDefault());
    this.superPlusState.set(crearSuperPlusDefault());
    this.tablaVariablesState.set([]);
    this.tablaEfectividadState.set([]);
    this.calculadoraState.set(crearCalculadoraDefault());
  }

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

  /** Fecha de corte de campaña (YYYYMMDD). */
  fechaCorte(): string {
    return this.fechaSeleccionada ?? this.shell.usuarioActivo()?.fechaCorte ?? new Date().toISOString().slice(0, 10).replace(/-/g, '');
  }

  /** Recarga datos a otra fecha de corte. */
  seleccionarFecha(fecha: string): void {
    this.sincronizarIdentidad();
    this.fechaSeleccionada = fecha;
    const nivel = this.nivelActual();
    if (nivel) this.cargarDatos(nivel);
  }

  /** Arranca el módulo — llamar una vez al entrar a la pantalla. */
  iniciar(): void {
    this.limpiar();
    this.identidad = identidadConsulta(this.shell.usuarioActivo());
    this.cargandoState.set(true);
    this.errorState.set(null);
    this.perfilState.set(null);
    this.nivelActualState.set(null);
    this.fechaSeleccionada = null;

    const esAdmin = this.shell.esAdmin();
    this.puedeElegirNivelState.set(esAdmin);
    this.monetizadoState.update((actual) => ({ ...actual, mostrarModelo: !esAdmin, fechasHabilitadas: this.calcularFechasHabilitadas() }));

    if (esAdmin) {
      this.requiereSeleccionInicialState.set(true);
      this.cargandoState.set(false);
      this.cargarRaizJerarquia();
      return;
    }

    this.requiereSeleccionInicialState.set(false);
    const codRel = this.codBt;
    if (!codRel) {
      this.errorState.set('No se pudo determinar tu código de negocio/agencia.');
      this.cargandoState.set(false);
      return;
    }
    const usuario = this.shell.usuarioActivo();
    const claUsu = (usuario?.claUse as 1 | 2) ?? 1;
    // El legado Incentivos3 muestra la identidad de la sesión, no un texto
    // genérico: `profile.nombre`, `profile.cargo` y `profile.pic_url`.
    this.seleccionarNivel(
      {
        nombre: usuario?.nombre || 'Mi perfil',
        nivel: 'CARGO',
        descripcionNivel: usuario?.cargo || '--',
        imagenUrl: usuario?.avatarUrl || '',
      },
      { tipCod: 1, codRel, claUsu },
    );
  }

  /** Recarga el Cuadro de Mando del nivel actualmente seleccionado (botón "Actualizar"). */
  actualizar(): void {
    this.sincronizarIdentidad();
    const nivel = this.nivelActual();
    if (nivel) this.cargarDatos(nivel);
  }

  /** Reintenta la consulta conservando el nivel; sin nivel, reinicia el selector inicial. */
  reintentar(): void {
    const nivel = this.nivelActual();
    if (nivel) {
      this.cargarDatos(nivel);
      return;
    }
    this.iniciar();
  }

  /** Fechas de corte re-consultables más la vigente. */
  private calcularFechasHabilitadas(): string[] {
    const usuario = this.shell.usuarioActivo();
    const habilitadas = (usuario?.fechasHabilitadas ?? '')
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean);
    if (usuario?.fechaCorte) habilitadas.push(usuario.fechaCorte);
    return [...new Set(habilitadas)].sort().reverse();
  }

  /** Carga la raíz de jerarquía para el selector de nivel. */
  private cargarRaizJerarquia(): void {
    this.consultaRaiz?.unsubscribe();
    const identidad = this.identidad;
    this.loading.show('Cargando jerarquía…');
    this.consultaRaiz = this.antAdmin.getBaseHierarchy(this.email, COD_JERARQUIA_ORGANIZATIVA).pipe(
      finalize(() => this.loading.hide()),
    ).subscribe({
      next: (respuesta) => {
        if (identidad !== identidadConsulta(this.shell.usuarioActivo())) return;
        const h = (respuesta.body as { base_hierarchy?: { tip_cod: number; cod_rel: string }[] } | null)?.base_hierarchy;
        if (h?.[0]) {
          this.raizJerarquia = { tipCod: h[0].tip_cod, codRel: h[0].cod_rel };
        } else {
          this.errorState.set('No se pudo determinar tu jerarquía base.');
        }
      },
      error: () => {
        if (identidad !== identidadConsulta(this.shell.usuarioActivo())) return;
        this.errorState.set('No se pudo determinar tu jerarquía base.');
      },
    });
  }

  /** Niveles listados desde la raíz de jerarquía del usuario. */
  obtenerNivelesJerarquia(tipCodListado: number): Observable<NodoJerarquiaIncentivo[]> {
    if (!this.raizJerarquia) return throwError(() => new Error('La jerarquía base todavía no está lista.'));
    const raiz = this.raizJerarquia;
    return this.ant
      .getFromHierList(raiz.tipCod, raiz.codRel, tipCodListado)
      .pipe(map((r) => (r.body as ListaJerarquiaBody | null)?.resultado ?? []));
  }

  /** Colaboradores disponibles para el selector. */
  obtenerAsesores(): Observable<AsesorPickItem[]> {
    if (!this.raizJerarquia) return throwError(() => new Error('La jerarquía base todavía no está lista.'));
    const raiz = this.raizJerarquia;
    return this.antAdmin
      .getListPick01(raiz.tipCod, raiz.codRel)
      .pipe(map((r) => (r.body as AsesoresBody | null)?.list_res ?? []));
  }

  /** Financiera Confianza consolidada. */
  seleccionarFinancieraConfianza(claUsu: 1 | 2): void {
    this.sincronizarIdentidad();
    this.seleccionarNivel(
      CABECERA_FINANCIERA_CONFIANZA,
      { tipCod: 7, codRel: '231', claUsu }
    );
  }

  /** Asesor elegido en el selector. */
  seleccionarAsesor(asesor: AsesorPickItem): void {
    this.sincronizarIdentidad();
    const claUsu = asesor.cod_gru ?? 1;
    this.monetizadoState.update((actual) => ({ ...actual, mostrarModelo: claUsu === 1 }));
    this.seleccionarNivel(
      { nombre: asesor.des_sec, nivel: 'CARGO', descripcionNivel: asesor.des_car ?? '--', imagenUrl: asesor.pic_url ?? '' },
      { tipCod: 1, codRel: asesor.cod_sec, claUsu }
    );
  }

  /** Nodo elegido en el selector de jerarquía. */
  seleccionarNodoJerarquia(nodo: NodoJerarquiaIncentivo): void {
    this.sincronizarIdentidad();
    this.monetizadoState.update((actual) => ({ ...actual, mostrarModelo: false }));
    this.seleccionarNivel(
      { nombre: nodo.des_rel, nivel: nodo.tip_rel ?? '--', descripcionNivel: nodo.des_rel, imagenUrl: '' },
      { tipCod: nodo.tip_cod, codRel: nodo.cod_rel, claUsu: nodo.cod_gru ?? 1 }
    );
  }

  private seleccionarNivel(perfil: PerfilUsuarioIncentivo, nivel: NivelSeleccionado): void {
    this.perfilState.set(perfil);
    this.requiereSeleccionInicialState.set(false);
    this.cargarDatos(nivel);
  }

  private cargarDatos(nivel: NivelSeleccionado): void {
    this.consultaDatos?.unsubscribe();
    const identidad = this.identidad;
    this.revisionConsulta++;
    this.cargandoState.set(true);
    this.errorState.set(null);
    this.nivelActualState.set(nivel);

    const puedeSimular = ![20, 7].includes(nivel.tipCod);
    const cfg = resolverConfiguracionUsuario(nivel.tipCod, nivel.claUsu);
    const fec = this.fechaCorte();
    this.fechaActualState.set(fec);

    const fuente$ =
      nivel.claUsu === 2
        ? this.ant.getDataSourcesGrupal(nivel.tipCod, nivel.codRel, fec)
        : this.ant.getDataSourcesIndividual(this.modelo, nivel.tipCod, nivel.codRel, fec);

    this.consultaDatos = fuente$.pipe(
      map((respuesta) => {
        const ds = (respuesta.body as ResultadosBody | null)?.resultado;
        if (ds != null && (typeof ds !== 'object' || Array.isArray(ds))) {
          throw new Error('Resultados de Incentivos inválidos.');
        }
        return mapearResultadosIncentivos(ds ?? {}, cfg, nivel, puedeSimular);
      }),
    ).subscribe({
      next: (vista) => {
        if (identidad !== identidadConsulta(this.shell.usuarioActivo())) return;
        this.tablaVariablesState.set(vista.tablaVariables);
        this.tablaEfectividadState.set(vista.tablaEfectividad);
        this.semaforoState.set(vista.semaforo);
        this.avancesState.set(vista.avances);
        this.superPlusState.set(vista.superPlus);
        this.monetizadoState.update(actual => ({ ...actual, ...vista.monetizado }));
        this.calculadoraState.set(vista.calculadora);
        this.cargandoState.set(false);
      },
      error: () => {
        if (identidad !== identidadConsulta(this.shell.usuarioActivo())) return;
        this.errorState.set('No se pudo cargar el Cuadro de Mando.');
        this.cargandoState.set(false);
      },
    });
  }

  /** Limpia estado antes de usar una acción que puede ejecutarse tras cambiar de usuario. */
  private sincronizarIdentidad(): void {
    const identidad = identidadConsulta(this.shell.usuarioActivo());
    if (identidad === this.identidad) return;
    this.identidad = identidad;
    this.limpiar();
  }

  /** Simulación de la Calculadora. */
  simular(valores: Record<string, number>): Observable<boolean> {
    const identidad = identidadConsulta(this.shell.usuarioActivo());
    const revision = this.revisionConsulta;
    const nivel = this.nivelActual();
    const calc = this.calculadora();
    if (!nivel) throw new Error('No hay un nivel seleccionado para simular.');

    const payload = { ...valores, tip_cod: nivel.tipCod, cod_rel: nivel.codRel, mar_ren: calc.margenRenovacion };
    const fec = this.fechaCorte();

    const fuente$ = nivel.claUsu === 2 ? this.ant.calcularGrupal(payload, fec) : this.ant.calcularIndividual(this.modelo, payload, fec);

    return fuente$.pipe(
      map((respuesta) => {
        if (revision !== this.revisionConsulta || identidad !== identidadConsulta(this.shell.usuarioActivo())) return false;
        const ds = (respuesta.body as SimulacionBody | null)?.resultado;
        if (!ds) return false;

        const bonoBase = sumarPorIds(ds, CFG_INDIVIDUAL_SECTORISTA.prof, CLAVES_INCENTIVOS.bonoBase, '');
        const bonoPlus = sumarPorIds(ds, CFG_INDIVIDUAL_SECTORISTA.prof, CLAVES_INCENTIVOS.bonoPlus, '');
        const bonoSuperPlus = sumarPorIds(ds, calc.plus.filter((p) => p.suma).map((p) => p.id), CLAVES_INCENTIVOS.bonoSuperPlus, '');

        const variables = asignarValores(asignarValores(calc.variables, ds, 'bob', CLAVES_INCENTIVOS.bonoBase, '', aNumeroIncentivo), ds, 'bop', CLAVES_INCENTIVOS.bonoPlus, '', aNumeroIncentivo);
        const plus = asignarValores(calc.plus, ds, 'bos', CLAVES_INCENTIVOS.bonoSuperPlus, '', aNumeroIncentivo);

        this.calculadoraState.set({
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

  /** Datos del diálogo de detalle de variable. */
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

  /** Datos del diálogo de Bancarización. */
  obtenerBancarizacion(tipCod: number, codRel: string): Observable<ResultadoBancarizacion> {
    return this.ant.getCliBanc(tipCod, codRel, this.fechaCorte()).pipe(
      map((r) => {
        const resultado = (r.body as BancarizacionBody | null)?.resultado;
        return { filas: resultado?.det ?? [], totales: resultado?.tot ?? null };
      })
    );
  }
}
