import { Injectable, inject, signal } from '@angular/core';
import { DriverTourService } from '../../../../shared/services/driver-tour.service';
import type { ModoEjemploNovedad, Novedad, PosePachi } from '../models/novedad.model';

/** Carpeta de las imágenes de Pachi, el personaje que guía los recorridos. */
const MASCOTA = '/assets/images/fc/tours/mascota-';

/** Lado real de cada PNG de Pachi (se pinta a 64-132 px; 256 cubre pantallas 2x). */
const LADO_MASCOTA = 256;

/**
 * Cuánto espera un paso a que aparezca su ancla. Alcanza para que Angular pinte
 * lo que abrió el paso anterior (el menú, el diálogo); con 2,5 s, un ancla que
 * nunca llegaba dejaba el botón "Siguiente" sin respuesta y el recorrido parecía
 * colgado. driver.js corta la espera apenas el ancla aparece.
 */
const ESPERA_ANCLA_MS = 1_200;

/** Tope para precargar a Pachi antes del primer globo: mejor arrancar que esperar la red. */
const ESPERA_PRECARGA_MS = 400;

/**
 * Envuelve el texto del paso con **Pachi**, que es quien "da" la guía.
 * `description` de driver.js se pinta con `innerHTML` (ver `driver.js.mjs`),
 * así que acepta este marcado; el texto es literal nuestro, no entra nada del
 * usuario ni del backend. La imagen va como decorativa: lo que se lee es el
 * texto.
 */
function conPachi(texto: string, pose: PosePachi = 'guia'): string {
  // `width`/`height` son las medidas reales del archivo: con ellas el navegador
  // conoce la proporción antes de decodificar y el globo no salta mientras el
  // PNG carga. El tamaño en pantalla lo sigue fijando el CSS.
  return `<span class="mis-tour-fila"><img class="mis-tour-mascota mis-tour-mascota--${pose}" src="${MASCOTA}${pose}.png" width="${LADO_MASCOTA}" height="${LADO_MASCOTA}" decoding="async" alt="" aria-hidden="true"><span class="mis-tour-texto">${texto}</span></span>`;
}

/**
 * Anclas de los pasos. Son elementos del shell que están siempre en pantalla
 * cuando se mira el Home, así que no hace falta ensuciar las plantillas de los
 * módulos con `id` de tour: se apunta a lo que ya los identifica (el mismo
 * criterio que usan los specs de e2e). Ver ADR-0004.
 */
const ANCLA = {
  // ── Shell real ──────────────────────────────────────────────────────
  rail: '#tour-sidebar-icons',
  buscador: '#buscador-global input[aria-label="Buscar reportes y carpetas en todos los sistemas"]',
  buscadorCaja: '#buscador-global .mis-buscador-caja',
  // Abierto pasa a "Cerrar búsqueda global": el ancla vale para los dos estados.
  buscadorBoton: 'header button[aria-label$="búsqueda global"]',
  perfil: 'header [aria-haspopup="true"]',
  abrirConfiguracion: '.perfil-menu .perfil-item',
  buscarAjuste: '.mis-configuracion-dialog input[aria-label="Buscar ajuste"]',
  configSecciones: '.mis-configuracion-dialog .mis-config-secciones',
  configContenido: '.mis-configuracion-dialog .mis-config-contenido',
  breadcrumbReal: 'header .header-breadcrumb',
  temaBoton: 'header button[aria-pressed]',

  // ── Demo: navegación ────────────────────────────────────────────────
  demoSidebarRail: '.demo-navegacion--navegacion .demo-sidebar-rail',
  demoSistema: '.demo-navegacion--navegacion [aria-label="Abrir el sistema Reportes"]',
  demoExplorador: '.demo-navegacion--navegacion .demo-explorador',
  demoCarpeta: '.demo-navegacion--navegacion [data-demo-nodo="Cartera"]',
  demoReporte: '.demo-navegacion--navegacion [data-demo-nodo="Saldo de cartera"]',
  demoBreadcrumb: '.demo-navegacion--navegacion .demo-breadcrumb',
  demoSemaforo: '.demo-navegacion--navegacion .demo-semaforo',
  demoAcciones: '.demo-navegacion--navegacion .demo-navegacion-acciones',
  demoKpis: '.demo-navegacion--navegacion .demo-kpis-fila',
} as const;

/** "🔎 Abre la búsqueda" → "🔎 Paso 1 · Abre la búsqueda": el emoji queda adelante. */
function numerarPaso(titulo: string, numero: number): string {
  const espacio = titulo.indexOf(' ');
  return `${titulo.slice(0, espacio + 1)}Paso ${numero} · ${titulo.slice(espacio + 1)}`;
}

/** Anclas que el shell oculta en el celular: sus pasos no se muestran ahí. */
const SOLO_ESCRITORIO: ReadonlySet<string> = new Set([ANCLA.demoBreadcrumb]);

/** Catálogo de novedades del sistema, de la más reciente a la más antigua. */
const NOVEDADES: Novedad[] = [
  // ═══════════════════════════════════════════════════════════════════════
  // 1. Búsqueda global — 5 pasos
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'busqueda-global',
    titulo: 'Encuentra un reporte sin recorrer menús',
    resumen:
      'La búsqueda global propone reportes y carpetas mientras escribes y permite filtrar resultados.',
    icono: 'pi pi-search',
    categoria: 'Buscar',
    posePachi: 'buscar',
    fecha: '2026-09-23',
    pasos: [
      {
        element: ANCLA.buscadorBoton,
        advanceOnClick: true,
        popover: {
          title: '🔎 Abre la búsqueda global',
          description: conPachi(
            '¡Hola! Soy <b>Baby Pachi</b>. Pulsa este botón de lupa para abrir la barra de búsqueda. Funciona desde cualquier pantalla del sistema sin importar en qué reporte estés.',
            'saluda',
          ),
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: ANCLA.buscador,
        popover: {
          title: '⌨️ Escribe para buscar',
          description: conPachi(
            'Empieza a escribir una palabra clave. Por ejemplo: <b>indicador</b>, <b>desembolso</b> o <b>resumen</b>. Los resultados aparecen mientras escribes, sin necesidad de presionar Enter.',
            'escribe',
          ),
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: ANCLA.buscadorCaja,
        popover: {
          title: '📋 Resultados agrupados',
          description: conPachi(
            'Los resultados se agrupan por <b>tipo</b>: reportes, carpetas y sistemas. Si tienes muchos resultados, las etiquetas de tipo te ayudan a ubicar lo que buscas más rápido.',
            'piensa',
          ),
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: ANCLA.buscadorCaja,
        popover: {
          title: '🎯 Navega con el teclado',
          description: conPachi(
            'Usa las flechas <b>↑ ↓</b> para moverte entre resultados y <b>Enter</b> para abrir el seleccionado. También puedes hacer clic directamente en cualquier resultado de la lista.',
            'guia',
          ),
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: ANCLA.buscadorBoton,
        popover: {
          title: '✅ Cierra cuando termines',
          description: conPachi(
            'Para cerrar la búsqueda sin abrir un resultado, pulsa de nuevo este botón, presiona <b>Escape</b>, o haz clic fuera del campo. Tu navegación actual no se pierde.',
            'feliz',
          ),
          side: 'bottom',
          align: 'end',
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 2. Sistemas y paneles — 9 pasos (8 en el celular: sin breadcrumb)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'sistemas-y-paneles',
    titulo: 'Navega por sistemas y sus paneles',
    resumen: 'Abre un sistema desde el rail y recorre sus carpetas y reportes como en un explorador de archivos.',
    icono: 'pi pi-th-large',
    categoria: 'Navegar',
    posePachi: 'camina',
    fecha: '2026-09-22',
    pasos: [
      {
        element: ANCLA.demoSidebarRail,
        popover: {
          title: '🏗️ El rail de sistemas',
          description: conPachi(
            'Cada ícono es un <b>sistema</b> del MIS: Reportes, Clientes, Incentivos… Ves los que tu perfil tiene asignados. En escritorio está a la izquierda; en el celular, abajo.',
            'guia',
          ),
        },
      },
      {
        element: ANCLA.demoSistema,
        advanceOnClick: true,
        popover: {
          title: '👆 Abre un sistema',
          description: conPachi('<b>Toca Reportes</b> para abrirlo.', 'camina'),
        },
      },
      {
        element: ANCLA.demoExplorador,
        popover: {
          title: '📂 El explorador del sistema',
          description: conPachi(
            'El sistema se abre como un <b>explorador de archivos</b>: carpetas y reportes, igual que en tu computadora. No hay un menú lateral aparte: todo se navega desde aquí.',
            'feliz',
          ),
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: ANCLA.demoCarpeta,
        advanceOnClick: true,
        popover: {
          title: '📁 Entra a una carpeta',
          description: conPachi('Las carpetas agrupan reportes. <b>Toca Cartera</b> para ver lo que tiene.', 'piensa'),
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: ANCLA.demoReporte,
        advanceOnClick: true,
        popover: {
          title: '📊 Abre un reporte',
          description: conPachi('Ahora <b>toca Saldo de cartera</b>: los reportes se abren en su propia ventana.', 'buscar'),
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: ANCLA.demoBreadcrumb,
        popover: {
          title: '🧭 Dónde estás',
          description: conPachi(
            'El breadcrumb muestra el camino: <b>Inicio › Reportes › Cartera › Saldo de cartera</b>. En el celular no se muestra, para dejar espacio.',
            'guia',
          ),
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: ANCLA.demoSemaforo,
        popover: {
          title: '🚦 Volver un nivel',
          description: conPachi(
            'La luz <b>amarilla</b> sube un nivel: del reporte a su carpeta, y de la carpeta al explorador. La <b>roja</b> cierra y la <b>verde</b> pasa a pantalla completa.',
            'idea',
          ),
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: ANCLA.demoAcciones,
        popover: {
          title: '⚡ Filtros y actualizar',
          description: conPachi(
            'El <b>embudo</b> abre o cierra los filtros del reporte; la <b>flecha circular</b> recarga los datos sin perder lo que elegiste.',
            'trabaja',
          ),
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: ANCLA.demoKpis,
        popover: {
          title: '🎉 Los datos del reporte',
          description: conPachi(
            'Aquí van los indicadores, tablas y gráficos de cada reporte. ¡Ya sabes navegar por sistemas, carpetas y reportes!',
            'feliz',
          ),
          side: 'top',
          align: 'center',
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 3. Configuración personal — 7 pasos
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'configuracion-personal',
    titulo: 'Personaliza tu espacio de trabajo',
    resumen:
      'Desde Configuración ajustas apariencia, navegación y comunicados sin afectar tus reportes.',
    icono: 'pi pi-cog',
    categoria: 'Personalizar',
    posePachi: 'idea',
    fecha: '2026-09-21',
    // Secuencial: resalta el perfil y espera su clic, luego la opción
    // Configuración y después el diálogo. No se abre nada por el usuario, así
    // "Anterior" nunca vuelve a un paso cuya pantalla ya no existe.
    pasos: [
      {
        element: ANCLA.temaBoton,
        popover: {
          title: '🌗 Cambia el tema',
          description: conPachi(
            '¡Hola! Soy <b>Baby Pachi</b>. Este botón alterna entre <b>modo claro</b> y <b>modo oscuro</b>. El cambio se aplica de inmediato y queda guardado en tus preferencias.',
            'saluda',
          ),
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: ANCLA.perfil,
        advanceOnClick: true,
        popover: {
          title: '👤 Abre tu perfil',
          description: conPachi(
            'El resto de ajustes vive en tu perfil. <b>Púlsalo</b> y te muestro dónde está Configuración.',
            'guia',
          ),
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: ANCLA.abrirConfiguracion,
        advanceOnClick: true,
        popover: {
          title: '⚙️ Entra a Configuración',
          description: conPachi('Pulsa <b>Configuración</b> para abrir el panel de ajustes.', 'idea'),
          side: 'left',
          align: 'start',
        },
      },
      {
        element: ANCLA.buscarAjuste,
        popover: {
          title: '🔍 Busca un ajuste',
          description: conPachi(
            'Escribe aquí para filtrar ajustes. Por ejemplo: <b>apariencia</b>, <b>tema</b> o <b>comunicados</b>. El buscador filtra las secciones e ítems que coincidan con tu texto.',
            'buscar',
          ),
          side: 'right',
          align: 'start',
        },
      },
      {
        element: ANCLA.configSecciones,
        popover: {
          title: '📑 Secciones de configuración',
          description: conPachi(
            'La columna de <b>secciones</b> agrupa los ajustes por tema: Apariencia, Estructura de menú, Comunicados y más. Al elegir una sección, sus ítems aparecen al lado.',
            'piensa',
          ),
          side: 'right',
          align: 'start',
        },
      },
      {
        element: ANCLA.configContenido,
        popover: {
          title: '✅ Ajusta y listo',
          description: conPachi(
            'Aquí aparecen los <b>controles</b> del ítem elegido. Los cambios son <b>por usuario</b> y no afectan a otros compañeros. ¡Explora y hazlo tuyo!',
            'feliz',
          ),
          side: 'left',
          align: 'start',
        },
      },
    ],
  },

];

/** Cuántos días una novedad se sigue mostrando como "Nuevo". */
const DIAS_NOVEDAD_NUEVA = 30;

/** Catálogo de novedades del Home y sus recorridos guiados. */
@Injectable({ providedIn: 'root' })
export class NovedadesTourService {
  private readonly driverTour = inject(DriverTourService);
  readonly ejemploActivo = signal<ModoEjemploNovedad>(null);

  /** Las novedades publicadas, de la más reciente a la más antigua. */
  readonly novedades: readonly Novedad[] = [...NOVEDADES].sort((a, b) =>
    b.fecha.localeCompare(a.fecha),
  );

  /** Cada `iniciar()` toma un turno: si llega otro mientras prepara, el anterior se descarta. */
  private turno = 0;

  /**
   * Prepara lo que el recorrido necesita en pantalla y recién entonces muestra
   * el globo. Los recorridos que enseñan un clic (la lupa, el perfil) no lo
   * hacen por el usuario: lo esperan con `advanceOnClick`. Antes la búsqueda se
   * abría sola, la lupa cambiaba de etiqueta y los pasos 1 y 5 se quedaban sin
   * ancla: el primero se salteaba y el último dejaba el recorrido colgado.
   */
  async iniciar(id: string): Promise<void> {
    const novedad = this.novedades.find((n) => n.id === id);
    if (!novedad) return;

    const turno = ++this.turno;
    this.driverTour.forceClose();
    this.ejemploActivo.set(null);

    await Promise.all([this.prepararInteraccion(novedad.id), this.precargarPachi(novedad)]);
    // Doble clic, u otra guía elegida mientras esta se preparaba: gana la última.
    if (turno !== this.turno) return;

    const movil = typeof matchMedia === 'function' && matchMedia('(max-width: 640px)').matches;
    // El número de paso se pone acá, sobre los pasos que de verdad se muestran (en el celular hay menos).
    const pasos = novedad.pasos
      .filter((p) => !(movil && SOLO_ESCRITORIO.has(String(p.element))))
      .map((p, i) => ({
        ...p,
        ...(p.advanceOnClick ? { disableActiveInteraction: false } : {}),
        popover: { ...p.popover, title: numerarPaso(String(p.popover?.title ?? ''), i + 1) },
      }));

    this.driverTour.createQuickTour(pasos, {
      popoverClass: 'mis-tour-popover',
      waitForElement: ESPERA_ANCLA_MS,
      skipMissingElement: true,
      // `onDestroyed` corre en todo cierre (Esc, ✕, Finalizar); `onDestroyStarted`
      // no corre cuando el recorrido lo cierra otro código.
      onDestroyed: () => this.ejemploActivo.set(null),
    });
  }

  private async prepararInteraccion(id: string): Promise<void> {
    if (typeof document === 'undefined') return;

    if (id === 'sistemas-y-paneles') {
      this.ejemploActivo.set('navegacion');
      await this.esperarPintado();
    }
  }

  /**
   * Descarga las poses del recorrido antes del primer globo. driver.js vuelve a
   * ubicar el globo cuando termina de cargar cada imagen: sin precarga, el globo
   * saltaba de lugar en cada paso nuevo.
   */
  private precargarPachi(novedad: Novedad): Promise<unknown> {
    if (typeof Image === 'undefined') return Promise.resolve();
    const poses = new Set(
      novedad.pasos.flatMap((p) =>
        [...String(p.popover?.description ?? '').matchAll(/mascota-([a-z]+)\.png/g)].map((m) => m[1]),
      ),
    );
    const cargas = [...poses].map((pose) => {
      const imagen = new Image();
      const cargada = new Promise<void>((resolver) => {
        imagen.onload = imagen.onerror = () => resolver();
      });
      imagen.src = `${MASCOTA}${pose}.png`;
      // `decode()` además deja la imagen lista para pintar; no todos los motores lo tienen.
      return typeof imagen.decode === 'function' ? imagen.decode().catch(() => undefined) : cargada;
    });
    return Promise.race([
      Promise.all(cargas),
      new Promise((resolver) => setTimeout(resolver, ESPERA_PRECARGA_MS)),
    ]);
  }

  private esperarPintado(): Promise<void> {
    return new Promise((resolver) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolver())),
    );
  }

  /** `true` mientras la novedad siga siendo reciente — es lo que pinta la etiqueta "Nuevo". */
  esNueva(novedad: Novedad, ahora = Date.now()): boolean {
    const publicada = Date.parse(novedad.fecha);
    if (Number.isNaN(publicada)) return false;
    return ahora - publicada < DIAS_NOVEDAD_NUEVA * 24 * 60 * 60 * 1000;
  }
}
