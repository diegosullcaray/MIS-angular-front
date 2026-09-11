import { normalizarHex } from '../../../../theme/color.util';
import { MODOS_TEMA, type ModoTema } from '../../../../shared/services/theme.service';

/**
 * Preferencias de la interfaz del Host: qué se ve y cómo se ordena. Son datos y
 * reglas puras: no saben dónde se guardan —eso lo resuelve
 * `REPOSITORIO_PREFERENCIAS`— ni cómo se pintan, que es trabajo de
 * `AparienciaDomAdaptador`.
 */

export { MODOS_TEMA };
export type { ModoTema };

// ─── Fondo del escritorio ───────────────────────────────────────────────────

/** Cómo se pinta un fondo: una foto, un color plano o un degradado. */
export type TipoFondo = 'imagen' | 'color' | 'degradado';

export interface OpcionFondo {
  readonly clave: string;
  readonly etiqueta: string;
  readonly tipo: TipoFondo;
  /**
   * Valor CSS listo para usar: `url(...)`/`linear-gradient(...)` van a
   * `background-image`, y un hex va a `background-color`. En
   * `personalizado` queda vacío: el valor lo pone el color que elige el
   * usuario (`PreferenciasApariencia.colorFondo`).
   */
  readonly valor: string;
  /** Cómo se dibuja la muestra del selector. */
  readonly muestra: string;
  /** El único fondo que conserva el velo del tema oscuro es la foto institucional. */
  readonly institucional?: boolean;
}

/** Clave del fondo cuyo color elige el usuario con el selector de color. */
export const FONDO_PERSONALIZADO = 'personalizado';

/**
 * Catálogo de fondos. El primero es el que trae el sistema de fábrica: la foto
 * institucional, que es la que hoy resuelven `--mis-wallpaper` y su velo en
 * `tokens.css` (por eso su `valor` va vacío: se deja que mande la hoja de
 * estilos, incluidos sus `@media` de escritorio y de tema oscuro).
 */
export const CATALOGO_FONDOS: readonly OpcionFondo[] = [
  {
    clave: 'institucional',
    etiqueta: 'Foto institucional',
    tipo: 'imagen',
    valor: '',
    muestra: "url('/assets/images/fc/fondos/wallpaper.png')",
    institucional: true,
  },
  {
    clave: 'navy',
    etiqueta: 'Navy',
    tipo: 'color',
    valor: '#1d396e',
    muestra: '#1d396e',
  },
  {
    clave: 'pizarra',
    etiqueta: 'Pizarra',
    tipo: 'color',
    valor: '#0e1626',
    muestra: '#0e1626',
  },
  {
    clave: 'niebla',
    etiqueta: 'Niebla',
    tipo: 'color',
    valor: '#f4f6f9',
    muestra: '#f4f6f9',
  },
  {
    clave: 'arena',
    etiqueta: 'Arena',
    tipo: 'color',
    valor: '#efe9df',
    muestra: '#efe9df',
  },
  {
    clave: 'degradado-navy',
    etiqueta: 'Degradado navy',
    tipo: 'degradado',
    valor: 'linear-gradient(160deg, #0b1f3f 0%, #1d396e 55%, #035096 100%)',
    muestra: 'linear-gradient(160deg, #0b1f3f 0%, #1d396e 55%, #035096 100%)',
  },
  {
    clave: 'degradado-amanecer',
    etiqueta: 'Degradado amanecer',
    tipo: 'degradado',
    valor: 'linear-gradient(160deg, #123a5c 0%, #2f6f9e 45%, #7fb4cf 100%)',
    muestra: 'linear-gradient(160deg, #123a5c 0%, #2f6f9e 45%, #7fb4cf 100%)',
  },
  {
    clave: FONDO_PERSONALIZADO,
    etiqueta: 'Color personalizado',
    tipo: 'color',
    valor: '',
    muestra: '',
  },
] as const;

export function buscarFondo(clave: string): OpcionFondo | undefined {
  return CATALOGO_FONDOS.find((f) => f.clave === clave);
}

// ─── Acento ─────────────────────────────────────────────────────────────────

/** Acentos sugeridos. El usuario igual puede elegir cualquier otro hex. */
export const ACENTOS_SUGERIDOS: readonly string[] = [
  '#0094ea',
  '#035096',
  '#0ea5e9',
  '#14b8a6',
  '#7c3aed',
  '#e11d48',
  '#f59e0b',
] as const;

// ─── Estructura ─────────────────────────────────────────────────────────────

/**
 * Modos del menú, con los mismos nombres de comportamiento que usa el layout
 * de PrimeNG (`static`, `slim`, `overlay`, `horizontal`), traducidos.
 *
 * Solo aplican desde el breakpoint `sm`: por debajo, el rail siempre es la
 * barra inferior fija — igual que en PrimeNG, donde el móvil siempre superpone.
 */
export type ModoSidebar = 'estatico' | 'delgado' | 'superpuesto' | 'horizontal';

export const MODOS_SIDEBAR: readonly ModoSidebar[] = [
  'estatico',
  'delgado',
  'superpuesto',
  'horizontal',
] as const;

export interface OpcionModoSidebar {
  readonly clave: ModoSidebar;
  readonly etiqueta: string;
  readonly descripcion: string;
  readonly icono: string;
}

export const CATALOGO_MODOS_SIDEBAR: readonly OpcionModoSidebar[] = [
  {
    clave: 'estatico',
    etiqueta: 'Estático',
    descripcion: 'El rail de sistemas queda fijo a la izquierda, con el nombre debajo de cada ícono.',
    icono: 'pi pi-th-large',
  },
  {
    clave: 'delgado',
    etiqueta: 'Delgado',
    descripcion: 'El mismo rail fijo pero solo con íconos: gana ancho el contenido.',
    icono: 'pi pi-bars',
  },
  {
    clave: 'superpuesto',
    etiqueta: 'Superpuesto',
    descripcion: 'El rail se oculta y se abre por encima del contenido desde el botón del header.',
    icono: 'pi pi-window-maximize',
  },
  {
    clave: 'horizontal',
    etiqueta: 'Horizontal',
    descripcion: 'Los sistemas se listan en una barra horizontal debajo del header.',
    icono: 'pi pi-ellipsis-h',
  },
] as const;

export type VistaExplorador = 'cuadricula' | 'lista';

export const VISTAS_EXPLORADOR: readonly VistaExplorador[] = ['cuadricula', 'lista'] as const;

// ─── Preferencias ───────────────────────────────────────────────────────────

export interface PreferenciasApariencia {
  readonly tema: ModoTema;
  /** Clave dentro de `CATALOGO_FONDOS`. */
  readonly fondo: string;
  /** Hex que se usa cuando `fondo === FONDO_PERSONALIZADO`. */
  readonly colorFondo: string;
  /** Hex del acento; de él se derivan hover y variante clara. */
  readonly acento: string;
}

export interface PreferenciasEstructura {
  readonly modoSidebar: ModoSidebar;
  /** Solo tiene efecto en `estatico`: `delgado` nunca muestra las etiquetas. */
  readonly etiquetasSidebar: boolean;
  readonly vistaExplorador: VistaExplorador;
}

export interface PreferenciasAnuncios {
  /** Ids ya cerrados por el usuario: la regla que evita que el diálogo spamee. */
  readonly vistos: readonly string[];
  /** Apaga el diálogo por completo, aunque haya anuncios nuevos. */
  readonly silenciar: boolean;
}

/**
 * Un reporte abierto por el usuario. Se guarda la **ruta** y no el `cod_rep`:
 * es lo que hace falta para volver, y hay pantallas que no tienen un código
 * único.
 */
export interface ReporteReciente {
  readonly ruta: string;
  readonly titulo: string;
  /** Epoch en ms; ordena la lista y alimenta el "hace un rato". */
  readonly fechaVisita: number;
  readonly categoria?: string;
}

/**
 * La bienvenida de Pachi, que se da una sola vez.
 *
 * Vive en `localStorage` como el resto de las preferencias. **Ojo con el
 * alcance real**: `LimpiezaSesionService` vacía `localStorage` al cerrar
 * sesión, así que "una sola vez" dura hasta el próximo logout. Es una
 * consecuencia conocida de la política de borrado total, no un descuido de este
 * campo.
 */
export interface PreferenciasBienvenida {
  readonly vista: boolean;
}

/** Cuántos accesos rápidos conserva el Home. */
export const MAX_RECIENTES = 6;

export interface Preferencias {
  readonly apariencia: PreferenciasApariencia;
  readonly estructura: PreferenciasEstructura;
  readonly anuncios: PreferenciasAnuncios;
  readonly bienvenida: PreferenciasBienvenida;
  readonly recientes: readonly ReporteReciente[];
}

/** Estado de fábrica: es el aspecto actual del Host, sin ninguna elección hecha. */
export const PREFERENCIAS_POR_DEFECTO: Preferencias = {
  apariencia: {
    tema: 'oscuro',
    fondo: 'institucional',
    colorFondo: '#1d396e',
    acento: '#0094ea',
  },
  estructura: {
    modoSidebar: 'estatico',
    etiquetasSidebar: true,
    vistaExplorador: 'cuadricula',
  },
  anuncios: {
    vistos: [],
    silenciar: false,
  },
  bienvenida: {
    vista: false,
  },
  recientes: [],
};

// ─── Saneamiento ────────────────────────────────────────────────────────────

function unoDe<T extends string>(valor: unknown, permitidos: readonly T[], porDefecto: T): T {
  return permitidos.includes(valor as T) ? (valor as T) : porDefecto;
}

function booleano(valor: unknown, porDefecto: boolean): boolean {
  return typeof valor === 'boolean' ? valor : porDefecto;
}

function hex(valor: unknown, porDefecto: string): string {
  return (typeof valor === 'string' ? normalizarHex(valor) : null) ?? porDefecto;
}

function objeto(valor: unknown): Record<string, unknown> {
  return typeof valor === 'object' && valor !== null ? (valor as Record<string, unknown>) : {};
}

/** Descarta cualquier entrada a la que le falte lo mínimo para poder abrirla. */
function recientes(valor: unknown): readonly ReporteReciente[] {
  if (!Array.isArray(valor)) return [];

  return valor
    .map((c) => objeto(c))
    .filter((c) => typeof c['ruta'] === 'string' && typeof c['titulo'] === 'string')
    .map((c) => ({
      ruta: c['ruta'] as string,
      titulo: c['titulo'] as string,
      fechaVisita: typeof c['fechaVisita'] === 'number' ? c['fechaVisita'] : 0,
      ...(typeof c['categoria'] === 'string' ? { categoria: c['categoria'] } : {}),
    }))
    .slice(0, MAX_RECIENTES);
}

/**
 * Convierte cualquier cosa venida del almacenamiento en unas preferencias
 * válidas. Es la frontera del dominio: lo guardado puede ser de una versión
 * anterior, estar a medias o directamente corrupto, y nada de eso puede
 * terminar en el DOM. Cada campo que no se entiende cae en su valor de fábrica.
 */
export function sanearPreferencias(crudo: unknown): Preferencias {
  const raiz = objeto(crudo);
  const apariencia = objeto(raiz['apariencia']);
  const estructura = objeto(raiz['estructura']);
  const anuncios = objeto(raiz['anuncios']);
  const bienvenida = objeto(raiz['bienvenida']);
  const base = PREFERENCIAS_POR_DEFECTO;

  const fondo = typeof apariencia['fondo'] === 'string' ? apariencia['fondo'] : '';

  return {
    apariencia: {
      tema: unoDe(apariencia['tema'], MODOS_TEMA, base.apariencia.tema),
      fondo: buscarFondo(fondo) ? fondo : base.apariencia.fondo,
      colorFondo: hex(apariencia['colorFondo'], base.apariencia.colorFondo),
      acento: hex(apariencia['acento'], base.apariencia.acento),
    },
    estructura: {
      modoSidebar: unoDe(estructura['modoSidebar'], MODOS_SIDEBAR, base.estructura.modoSidebar),
      etiquetasSidebar: booleano(estructura['etiquetasSidebar'], base.estructura.etiquetasSidebar),
      vistaExplorador: unoDe(estructura['vistaExplorador'], VISTAS_EXPLORADOR, base.estructura.vistaExplorador),
    },
    anuncios: {
      vistos: Array.isArray(anuncios['vistos'])
        ? anuncios['vistos'].filter((id): id is string => typeof id === 'string')
        : base.anuncios.vistos,
      silenciar: booleano(anuncios['silenciar'], base.anuncios.silenciar),
    },
    bienvenida: {
      vista: booleano(bienvenida['vista'], base.bienvenida.vista),
    },
    recientes: recientes(raiz['recientes']),
  };
}

/**
 * Fondo que se aplica realmente, ya resuelto el caso `personalizado` — que no
 * trae valor propio sino el color elegido por el usuario.
 */
export function fondoEfectivo(apariencia: PreferenciasApariencia): OpcionFondo {
  const opcion = buscarFondo(apariencia.fondo) ?? CATALOGO_FONDOS[0];
  if (opcion.clave !== FONDO_PERSONALIZADO) return opcion;

  return { ...opcion, valor: apariencia.colorFondo, muestra: apariencia.colorFondo };
}
