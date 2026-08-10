/**
 * Modelos del módulo "Incentivos" (`/app/incentivos3`) — migrado del legado
 * STG (`pages/modules/incentivos3`, backend Ant namespaces `incentivos3.*`/
 * `incentivos4.*`, mismo port/appId/secret que Presupuesto/ESG/Dashboard —
 * ver `ModIncentivosService`).
 *
 * Solo se migra lo que el legado realmente enruta/renderiza (Cuadro de
 * Mando, Calculadora, Detalle, Detalle Bancarización, Selector de Nivel).
 * `Historico`/`Composicion`/`Aportes` quedan fuera — código muerto
 * confirmado por auditoría (`docs/06-legado-sistema-anterior/incentivos-auditoria.md`):
 * declarados y con datos poblados, pero sin ningún consumidor en ningún
 * template del legado.
 */

/** Nodo/usuario cuyos datos se están consultando ahora mismo (propio o elegido vía el selector de nivel). */
export interface NivelSeleccionado {
  tipCod: number;
  codRel: string;
  /** 0 = sin asignar, 1 = individual, 2 = grupal — determina qué matriz de configuración (`ConfiguracionUsuario`) aplica. */
  claUsu: number;
}

/** Encabezado del perfil consultado — nombre, nivel/cargo, foto. */
export interface PerfilUsuarioIncentivo {
  nombre: string;
  nivel: string;
  descripcionNivel: string;
  imagenUrl: string;
}

/** Ítem del "semáforo" de variables del perfil (`perfil.sem` del legado) — icono + valor 0/1/2 (mal/regular/bien). */
export interface ItemSemaforo {
  id: string;
  des: string;
  icono: string;
  val: number;
  show: boolean;
}

/** Ítem de la grilla de Avances — igual que `ItemSemaforo` + porcentaje de avance y habilitación de detalle. */
export interface ItemAvance {
  id: string;
  des: string;
  icono: string;
  val: number;
  /** Porcentaje ya redondeado a entero 0-100, usado para el arco del `p-knob`. */
  per: number;
  /** 1 = alcanzó la meta, 2 = no aplica/otro estado — colorea el ícono de estado. */
  sit: number;
  show: boolean;
  enab: boolean;
}

/** Parámetros que identifican qué diálogo de detalle abrir y con qué endpoint pedir sus datos. */
export interface ParametrosDetalle {
  /** 1 = abre `DetalleVariableDialogComponent`, 2 = abre `DetalleBancarizacionDialogComponent`. */
  comp: 1 | 2;
  req: 'getDetail' | 'getTasa' | 'getProd' | 'getCliBanc' | 'getRetencion';
  /** Si el diálogo de detalle muestra las 3 tarjetas KPI (Cierre/Variación/Meta). */
  card: boolean;
  /** 'cv' = variable de cartera/cliente (índice de `itemsDetalleVariable`), 'sp' = variable de Super Plus (índice de `itemsDetalleSuperPlus`). */
  typ?: 'cv' | 'sp';
}

/** Ítem de la grilla de Super Plus (`super-plus.util.ts` del legado). */
export interface ItemSuperPlus {
  id: string;
  des: string;
  icono: string;
  val: number;
  show: boolean;
  enab: boolean;
  /** 0 = sin datos suficientes (se pinta neutro), 1 = con datos (positivo/negativo según `val`). */
  estado: number;
  parametros: ParametrosDetalle;
}

/** Estado del panel de Monetización (`monetizado.util.ts` del legado). */
export interface MonetizadoIncentivo {
  bonoBase: number;
  bonoPlus: number;
  bonoSuperPlus: number;
  bonoTotal: number;
  /** 1 = activado, 0 = desactivado o no aplica. */
  codigoSituacion: number;
  descripcionSituacion: string;
  puedeSimular: boolean;
  /** Fijo en `'2026'` — el botón de UI para cambiarlo ya estaba comentado en el legado, ver `IncentivosService`. */
  modelo: string;
  modeloDescripcion: string;
  /** Solo se muestra la etiqueta de modelo si el usuario es SECTORISTA individual (`niv==='SECTORISTA' && cla_use===1`). */
  mostrarModelo: boolean;
  /** Fechas en formato `YYYYMMDD` habilitadas para re-consultar el Cuadro de Mando a una fecha de corte distinta. */
  fechasHabilitadas: string[];
}

/** Fila de la tabla "Variables" (cierre/traslado/variación/monetización) del Cuadro de Mando. */
export interface FilaTablaVariable {
  cod_var: number;
  ini_n?: number;
  cie_n?: number;
  cie_n_o?: number;
  cie_n_d?: number;
  var_real?: number;
  met?: number;
  mon?: number;
  /** >= 1 alcanzó la meta — colorea la celda `met`. */
  avan_fix?: number;
}

/** Fila de la tabla "Efectividad" del Cuadro de Mando. */
export interface FilaTablaEfectividad {
  cod_var: number;
  ini?: number;
  man_efe?: number;
  rec?: number;
  efec?: number;
  met?: number;
  mon?: number;
  avan_fix?: number;
}

/** Variable editable en la Calculadora (`calculadora.vars`). */
export interface VariableCalculadora {
  id: string;
  des: string;
  icono: string;
  formato: 'number' | 'percent';
  /** Clave del payload de simulación (`v_<id>`). */
  key: string;
  bob: number;
  bop: number;
  met: number;
  val: number;
  show: boolean;
  /** Solo presentes cuando `id==='efec1'` y el usuario es individual — desglose de composición de pago puntual (debe sumar 100%). */
  tp1?: number;
  tp2?: number;
  tp3?: number;
}

/** Ítem Plus editable en la Calculadora (`calculadora.plus`). */
export interface PlusCalculadora {
  id: string;
  des: string;
  icono: string;
  formato: 'number' | 'percent';
  key: string;
  val: number;
  /** Solo presente cuando `id==='tas'` — tasa mínima editable, para calcular la diferencia en pbs contra `val`. */
  val1?: number;
  met?: number;
  bos: number;
  enab: boolean;
  show: boolean;
  /** Si participa en la suma del bono Super Plus total (`cal_s` de la matriz de configuración). */
  suma: boolean;
}

/** Estado completo de la Calculadora — variables + plus + totales. */
export interface CalculadoraConfig {
  variables: VariableCalculadora[];
  plus: PlusCalculadora[];
  bonoBase: number;
  bonoPlus: number;
  bonoSuperPlus: number;
  bonoTotal: number;
  /** 1 = comisiona, 0 = no comisiona — controla el texto/color de "Comisión Total". */
  activo: number;
  /** Margen de renovación — solo se usa para volver a armar el payload de simulación. */
  margenRenovacion: number;
  /** 1 = individual, 2 = grupal — determina si se validan `tp1/tp2/tp3` (composición de pago puntual). */
  claseUsuario: number;
}

/** Payload enviado a `incentivos4.calculadora4`/`.calculadora5` — claves dinámicas `v_*`/`p_*` según qué variables muestre el perfil. */
export type PayloadSimulacion = Record<string, number> & {
  tip_cod: number;
  cod_rel: string;
  mar_ren: number;
};

/** Nodo listado por `incentivos3.lista3` (selector de nivel — Unidades/Corredores/Territorios). */
export interface NodoJerarquiaIncentivo {
  tip_cod: number;
  cod_rel: string;
  des_rel: string;
  des_gru?: string;
  tip_rel?: string;
  /** 1 = individual, 2 = grupal. */
  cod_gru?: number;
}

/** Colaborador listado por `list_pick_01` (selector de nivel — "Asesores"). */
export interface AsesorPickItem {
  cod_sec: string;
  des_sec: string;
  des_car?: string;
  pic_url?: string;
  /** 1 = individual, 2 = grupal. */
  cod_gru?: number;
}

/** Nivel del selector de jerarquía habilitado por rol (`btns` del legado `SelectorJerComponent`). */
export interface NivelSelectorJerarquia {
  etiqueta: string;
  tipCodListado: number;
}

// ─── Detalle de variable (drill-down) ───────────────────────────────────────

/** Tarjetas KPI del diálogo de detalle (Cierre/Variación/Meta) — `res.card` de `incentivos3.detalle_var3`/`.tasas3`/`.productividad3`/`incentivos4.retencion4`. */
export interface CardDetalleVariable {
  cie_real: number;
  var_real: number;
  met: number;
  /** 0 = sin meta configurada (la tarjeta "Meta" muestra "--"). */
  exis_met: number;
  /** Porcentaje de avance (0-1) — colorea el semáforo de la tarjeta "Meta". */
  avan: number;
  f1: string;
  f2: string;
  /** Cantidad de bloques de variables disponibles para "drill" (`cod_block` 2..blocks). */
  blocks: number;
}

/** Fila de la tabla "Indicadores" del detalle — con drill-down opcional a otro bloque de variables (`cod_bdd`). */
export interface FilaVariableDetalle {
  des_var: string;
  /** Presente + `cod_block` con datos propios ⇒ la fila es clicable y abre ese bloque. */
  cod_bdd?: number;
  cod_block: number;
  fmt?: string;
  f1?: number;
  f2?: number;
  diff?: number;
}

/** Fila de la tabla "Ranking" del detalle — con drill-down a la ficha de ese `tip_cod`/`cod_rel`. */
export interface FilaRankingDetalle {
  des_rel: string;
  tip_cod: number;
  cod_rel: string;
  var_real: number;
  met: number;
  diff: number;
}

export interface ResultadoDetalleVariable {
  card: CardDetalleVariable;
  vars: FilaVariableDetalle[];
  rank: FilaRankingDetalle[];
}

// ─── Detalle de bancarización ────────────────────────────────────────────────

/** Fila de la tabla del detalle de Bancarización (`incentivos3.bancarizados3`). */
export interface FilaBancarizacion {
  nom: string;
  /** 1 = trasladado (contabiliza), 2 = heredado (no contabiliza). */
  tf: number;
  gen: number;
  rur: number;
  mig: number;
}

export interface TotalesBancarizacion {
  gen_c: number;
  rur_c: number;
  mig_c: number;
  tot_c: number;
  tot_m: number;
}

export interface ResultadoBancarizacion {
  filas: FilaBancarizacion[];
  totales: TotalesBancarizacion | null;
}
