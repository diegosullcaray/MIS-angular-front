import { Injectable, inject, signal } from '@angular/core';
import { DriverTourService } from '../../../../shared/services/driver-tour.service';
import type { ModoEjemploNovedad, Novedad, PosePachi } from '../models/novedad.model';

/** Carpeta de las imágenes de Pachi, el personaje que guía los recorridos. */
const MASCOTA = '/assets/images/fc/tours/mascota-';

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
  return `<span class="mis-tour-fila"><img class="mis-tour-mascota mis-tour-mascota--${pose}" src="${MASCOTA}${pose}.png" width="1024" height="1024" decoding="async" alt="" aria-hidden="true"><span class="mis-tour-texto">${texto}</span></span>`;
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
  buscadorBoton: 'header button[aria-label="Abrir búsqueda global"]',
  perfil: 'header [aria-haspopup="true"]',
  abrirConfiguracion: '.perfil-menu .perfil-item',
  configuracion: '.mis-configuracion-dialog',
  buscarAjuste: '.mis-configuracion-dialog input[aria-label="Buscar ajuste"]',
  configSecciones: '.mis-configuracion-dialog .mis-config-secciones',
  configContenido: '.mis-configuracion-dialog .mis-config-contenido',
  breadcrumbReal: 'header .header-breadcrumb',
  temaBoton: 'header button[aria-pressed]',

  // ── Demo: navegación ────────────────────────────────────────────────
  demoSidebarRail: '.demo-navegacion--navegacion .demo-sidebar-rail',
  ejemploNavegacion: '.demo-navegacion--navegacion [aria-label="Abrir panel de ejemplo"]',
  panelEjemplo: '.demo-navegacion--navegacion .demo-navegacion-panel',
  seccionEjemplo: '.demo-navegacion--navegacion .demo-navegacion-opcion:not(.demo-navegacion-opcion--activa)',
  demoBreadcrumb: '.demo-navegacion--navegacion .demo-breadcrumb',
  demoHeader: '.demo-navegacion--navegacion .demo-header',
  demoBarra: '.demo-navegacion--navegacion .demo-navegacion-barra',
  demoSemaforo: '.demo-navegacion--navegacion .demo-semaforo',
  demoAcciones: '.demo-navegacion--navegacion .demo-navegacion-acciones',
  demoKpis: '.demo-navegacion--navegacion .demo-kpis-fila',
  demoVentana: '.demo-navegacion--navegacion .demo-ventana',
} as const;

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
          title: '🔎 Paso 1 · Abre la búsqueda global',
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
          title: '⌨️ Paso 2 · Escribe para buscar',
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
          title: '📋 Paso 3 · Resultados agrupados',
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
          title: '🎯 Paso 4 · Navega con el teclado',
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
          title: '✅ Paso 5 · Cierra cuando termines',
          description: conPachi(
            'Para cerrar la búsqueda sin abrir un resultado, pulsa de nuevo este botón, presiona <b>Escape</b>, o haz clic fuera del campo. Tu navegación actual no se pierde.',
            'celebra',
          ),
          side: 'bottom',
          align: 'end',
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 2. Sistemas y paneles — 8 pasos
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'sistemas-y-paneles',
    titulo: 'Navega por sistemas y sus paneles',
    resumen: 'El sidebar cambia de sistema y muestra sus opciones antes de abrir un reporte.',
    icono: 'pi pi-th-large',
    categoria: 'Navegar',
    posePachi: 'camina',
    fecha: '2026-09-22',
    pasos: [
      {
        element: ANCLA.demoSidebarRail,
        popover: {
          title: '🏗️ Paso 1 · El rail de sistemas',
          description: conPachi(
            'Este es el <b>rail de sistemas</b>. Cada ícono representa un módulo del MIS: Reportes, Clientes, Incentivos, etc. En el sistema real aparecen los que tu perfil tiene asignados.',
            'guia',
          ),
          side: 'right',
          align: 'start',
        },
      },
      {
        element: ANCLA.ejemploNavegacion,
        popover: {
          title: '👆 Paso 2 · Selecciona un sistema',
          description: conPachi(
            '<b>Reportes</b> está seleccionado y su panel ya está abierto. En el sistema real, al pulsar un ícono se despliega el panel de ese módulo con todas las secciones disponibles para tu perfil.',
            'camina',
          ),
          side: 'right',
          align: 'start',
        },
      },
      {
        element: ANCLA.panelEjemplo,
        popover: {
          title: '📂 Paso 3 · El panel de secciones',
          description: conPachi(
            'Este panel muestra las <b>secciones</b> del sistema: Resumen, Indicadores, Detalle, Monitor. En el MIS real estas se configuran por perfil y pueden incluir carpetas anidadas con sub-reportes.',
            'feliz',
          ),
          side: 'right',
          align: 'start',
        },
      },
      {
        element: ANCLA.seccionEjemplo,
        popover: {
          title: '🖱️ Paso 4 · Elige una sección',
          description: conPachi(
            'Cada botón es una sección del módulo. Al elegirla, el panel la marca como activa, la barra de título se actualiza y el breadcrumb refleja tu nueva ubicación.',
            'piensa',
          ),
          side: 'right',
          align: 'start',
        },
      },
      {
        element: ANCLA.demoBreadcrumb,
        popover: {
          title: '🧭 Paso 5 · El breadcrumb',
          description: conPachi(
            'Observa el breadcrumb: muestra <b>Inicio › Reportes › Sección</b>. En el sistema real cada nivel es un enlace que te permite volver a ese punto sin usar el botón de retroceso del navegador.',
            'guia',
          ),
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: ANCLA.demoSemaforo,
        popover: {
          title: '🚦 Paso 6 · Controles de ventana',
          description: conPachi(
            'Las luces tipo <b>semáforo</b> son los controles de la ventana del reporte. En el MIS real: la <b>roja</b> cierra el reporte, la <b>amarilla</b> vuelve al panel del sistema, y la <b>verde</b> alterna pantalla completa.',
            'idea',
          ),
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: ANCLA.demoAcciones,
        popover: {
          title: '⚡ Paso 7 · Acciones rápidas',
          description: conPachi(
            'Estos botones controlan <b>filtros</b> y <b>actualización</b>. El embudo abre/cierra la franja de filtros; la flecha circular recarga los datos sin perder tus filtros activos ni la sección seleccionada.',
            'trabaja',
          ),
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: ANCLA.demoKpis,
        popover: {
          title: '📊 Paso 8 · Indicadores del reporte',
          description: conPachi(
            'Aquí se muestran los <b>KPIs</b> y datos principales de tu consulta. Cada reporte real muestra sus propios indicadores, tablas y gráficos según el sistema y la sección que elegiste. ¡Ya dominas la navegación!',
            'celebra',
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
    pasos: [
      {
        element: ANCLA.configuracion,
        popover: {
          title: '⚙️ Paso 1 · El panel de Configuración',
          description: conPachi(
            '¡Abrí la Configuración por ti! Normalmente accedes pulsando tu <b>perfil</b> en la esquina superior y eligiendo <b>Configuración</b> en el menú desplegable.',
            'saluda',
          ),
          side: 'left',
          align: 'start',
        },
      },
      {
        element: ANCLA.buscarAjuste,
        popover: {
          title: '🔍 Paso 2 · Busca un ajuste',
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
          title: '📑 Paso 3 · Secciones de configuración',
          description: conPachi(
            'La columna de <b>secciones</b> agrupa los ajustes por tema: Apariencia, Estructura de menú, Comunicados y más. Al elegir una sección, sus ítems aparecen en la siguiente columna.',
            'guia',
          ),
          side: 'right',
          align: 'start',
        },
      },
      {
        element: ANCLA.configContenido,
        popover: {
          title: '🎨 Paso 4 · Panel de ajustes',
          description: conPachi(
            'Este panel muestra los <b>controles</b> del ítem seleccionado. Por ejemplo, en <b>Apariencia</b> puedes cambiar el tema claro/oscuro, y en <b>Estructura</b> el tipo de menú.',
            'idea',
          ),
          side: 'left',
          align: 'start',
        },
      },
      {
        element: ANCLA.temaBoton,
        popover: {
          title: '🌗 Paso 5 · Cambia el tema',
          description: conPachi(
            'Este botón del header es un atajo para alternar entre <b>modo claro</b> y <b>modo oscuro</b>. El cambio se aplica de inmediato y se guarda en tus preferencias sin abrir Configuración.',
            'piensa',
          ),
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: ANCLA.perfil,
        popover: {
          title: '✅ Paso 6 · Todo listo',
          description: conPachi(
            'Ya sabes personalizar MIS. Recuerda: los cambios de configuración son <b>por usuario</b> y no afectan a otros compañeros. ¡Explora y hazlo tuyo!',
            'celebra',
          ),
          side: 'bottom',
          align: 'end',
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

  /**
   * Prepara el control que el recorrido enseña y solo entonces muestra el
   * globo. Así Pachi no describe una acción que el usuario tendría que abrir
   * manualmente antes de poder verla.
   */
  async iniciar(id: string): Promise<void> {
    const novedad = this.novedades.find((n) => n.id === id);
    if (!novedad) return;

    this.ejemploActivo.set(null);
    await this.prepararInteraccion(novedad.id);

    const pasos = novedad.pasos.map((p) => {
      if (p.advanceOnClick) {
        return {
          ...p,
          advanceOnClick: true,
          disableActiveInteraction: false,
        };
      }
      return p;
    });

    this.driverTour.createQuickTour(pasos, {
      popoverClass: 'mis-tour-popover',
      waitForElement: 2_500,
      skipMissingElement: true,
      onDestroyStarted: () => {
        this.ejemploActivo.set(null);
      },
    });
  }

  private async prepararInteraccion(id: string): Promise<void> {
    if (typeof document === 'undefined') return;

    if (id === 'busqueda-global') {
      this.click('header button[aria-label="Abrir búsqueda global"]');
      await this.esperarPintado();
      return;
    }

    if (id === 'configuracion-personal') {
      this.click('header [aria-haspopup="true"]');
      await this.esperarPintado();
      this.click('.perfil-menu .perfil-item');
      await this.esperarPintado();
      return;
    }

    if (id === 'sistemas-y-paneles') {
      this.ejemploActivo.set('navegacion');
      await this.esperarPintado();
      // Pre-abrir el panel para que los pasos que lo referencian lo encuentren
      // ya renderizado en el DOM. Sin esto, driver.js no localiza el elemento
      // y pinta el globo centrado, bloqueando el recorrido.
      this.click('.demo-navegacion--navegacion [aria-label="Abrir panel de ejemplo"]');
      await this.esperarPintado();
    }
  }

  private click(selector: string): void {
    (document.querySelector<HTMLElement>(selector) as HTMLButtonElement | null)?.click();
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
