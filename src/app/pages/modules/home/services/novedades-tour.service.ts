import { Injectable, inject } from '@angular/core';
import { DriverTourService } from '../../../../shared/services/driver-tour.service';
import type { Novedad } from '../models/novedad.model';

/** Carpeta de las imágenes de Pachi, el personaje que guía los recorridos. */
const MASCOTA = '/assets/images/fc/tours/mascota-';

/** Las poses de Pachi que hay en `assets/images/fc/tours/`. */
type PosePachi =
  | 'guia'
  | 'celebra'
  | 'saluda'
  | 'piensa'
  | 'sorpresa'
  | 'alerta'
  | 'feliz'
  | 'camina'
  | 'buscar'
  | 'escribe'
  | 'trabaja'
  | 'duda'
  | 'idea';

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
  rail: '#tour-sidebar-icons',
  perfil: 'header [aria-haspopup="true"]',
  comunicados: 'header button[aria-label="Comunicados del sistema"]',
  tema: 'header button[aria-label^="Activar modo"]',
  recientes: '.recientes',
  panel: '#novedades-panel',
} as const;

/** Catálogo de novedades del sistema, de la más reciente a la más antigua. */
const NOVEDADES: Novedad[] = [
  {
    id: 'filtros-y-actualizar',
    titulo: 'Filtros y actualizar, en cada panel',
    resumen: 'La franja de filtros se pliega, y el botón de la esquina vuelve a pedir los datos.',
    icono: 'pi pi-filter',
    fecha: '2026-09-11',
    // Sin ancla a propósito: los filtros viven en las pantallas de reporte, no
    // en el Home. driver.js pinta estos pasos centrados, como una tarjeta.
    pasos: [
      {
        popover: {
          title: '🔎 Los filtros tienen su franja',
          description: conPachi(
            '¡Hola! Soy <b>Pachi</b>. En cualquier panel de reporte vas a ver un botón de embudo en la barra de arriba: abre y cierra la franja de filtros. Mientras la tengas cerrada, la tabla se queda con toda la pantalla.',
            'buscar',
          ),
        },
      },
      {
        popover: {
          title: '🧭 Primero el nivel, después el resto',
          description: conPachi(
            'Dentro de la franja, el <b>selector de jerarquía</b> va siempre primero: elige el nivel y el reporte se arma solo. Los filtros propios de cada pantalla —la fecha de corte, el producto, la pestaña— quedan debajo.',
            'piensa',
          ),
        },
      },
      {
        popover: {
          title: '🔄 Volver a pedir los datos',
          description: conPachi(
            'En la esquina de la barra está el botón de <b>actualizar</b>. Pide el reporte otra vez con el mismo nivel y la misma fecha de corte, sin que tengas que elegir todo de nuevo. Gira mientras carga.',
            'trabaja',
          ),
        },
      },
    ],
  },
  {
    id: 'panel-novedades',
    titulo: 'Panel de novedades',
    resumen: 'Las mejoras del sistema, cada una con su recorrido guiado.',
    icono: 'pi pi-sparkles',
    fecha: '2026-09-09',
    // El único que necesita el panel a la vista: habla de él.
    requierePanel: true,
    pasos: [
      {
        element: ANCLA.panel,
        popover: {
          title: '✨ Acá viven las novedades',
          description: conPachi(
            '¡Hola! Soy <b>Pachi</b>, y te voy a mostrar el sistema nuevo. En este panel dejo cada mejora que entra, la más reciente arriba.',
            'saluda',
          ),
          side: 'left',
          align: 'start',
        },
      },
      {
        element: ANCLA.panel,
        popover: {
          title: '🖱️ Un clic y te la muestro',
          description: conPachi(
            'Elige cualquier novedad y te llevo por la pantalla señalando dónde está. Puedes cerrar el recorrido cuando quieras con <b>Esc</b>.',
            'guia',
          ),
          side: 'left',
          align: 'center',
        },
      },
    ],
  },
  {
    id: 'menu-perfil',
    titulo: 'Tu perfil, como en Chrome',
    resumen: 'Tarjeta con tu cuenta y cambio de perfil en un solo clic.',
    icono: 'pi pi-user',
    fecha: '2026-09-08',
    pasos: [
      {
        element: ANCLA.perfil,
        popover: {
          title: '👤 Tu menú de perfil',
          description: conPachi(
            'Abre este menú y vas a ver tu tarjeta arriba, con tu nombre y tu correo, igual que el selector de perfiles de Chrome.',
            'piensa',
          ),
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: ANCLA.perfil,
        popover: {
          title: '🔄 Cambiar de perfil',
          description: conPachi(
            'Si tienes cuentas asignadas, aparecen abajo en <b>Otros perfiles</b>: un clic cambia de cuenta, sin ventanas de confirmación. Desde ahí mismo vuelves a la tuya.',
            'feliz',
          ),
          side: 'bottom',
          align: 'end',
        },
      },
    ],
  },
  {
    id: 'ventanas-mac',
    titulo: 'Ventanas y diálogos estilo Mac',
    resumen: 'Cada módulo abre en una ventana con semáforo, y los diálogos también.',
    icono: 'pi pi-window-maximize',
    fecha: '2026-09-05',
    pasos: [
      {
        element: ANCLA.rail,
        popover: {
          title: '🗂️ Elige un sistema',
          description: conPachi(
            'Desde esta barra entras a cada sistema. Lo que abras se muestra dentro de una <b>ventana</b> con su propia barra de título, como en una Mac.',
            'camina',
          ),
          side: 'right',
          align: 'start',
        },
      },
      {
        element: ANCLA.rail,
        popover: {
          title: '🚦 Las tres luces',
          description: conPachi(
            'En esa barra están el <b>rojo</b>, que cierra y te devuelve al inicio; el <b>amarillo</b>, que sube un nivel —al explorador del sistema, de donde viniste—; y el <b>verde</b>, que abre la ventana a pantalla completa.',
            'alerta',
          ),
          side: 'right',
          align: 'center',
        },
      },
      {
        element: ANCLA.rail,
        popover: {
          title: '🪟 Los diálogos, igual',
          description: conPachi(
            'Las ventanas emergentes usan el mismo cromo: misma barra, mismo semáforo. Y se cierran haciendo clic fuera, sin buscar la X.',
            'idea',
          ),
          side: 'right',
          align: 'center',
        },
      },
    ],
  },
  {
    id: 'comunicados',
    titulo: 'Comunicados a un clic',
    resumen: 'Se abren solo cuando hay algo sin leer, y los reabres cuando quieras.',
    icono: 'pi pi-megaphone',
    fecha: '2026-09-02',
    pasos: [
      {
        element: ANCLA.comunicados,
        popover: {
          title: '📣 Los comunicados',
          description: conPachi(
            'Ya no aparecen en cada ingreso: el aviso salta solo cuando hay uno sin leer, y el puntito celeste te avisa. Desde este botón lo vuelves a abrir cuando quieras.',
            'sorpresa',
          ),
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: ANCLA.comunicados,
        popover: {
          title: '🔕 Entendido, o nunca más',
          description: conPachi(
            'Al pie del aviso hay dos salidas distintas: <b>Entendido</b> lo calla mientras dure esta sesión, y <b>No mostrar este comunicado</b> hace que no vuelva. Para apagarlos todos está <b>Configuración → Comunicados</b>.',
            'trabaja',
          ),
          side: 'bottom',
          align: 'center',
        },
      },
    ],
  },
  {
    id: 'escritorio',
    titulo: 'Tu escritorio de inicio',
    resumen: 'Modo claro y oscuro, color de acento y los últimos reportes que abriste.',
    icono: 'pi pi-desktop',
    fecha: '2026-08-28',
    pasos: [
      {
        element: ANCLA.tema,
        popover: {
          title: '🌗 Claro u oscuro',
          description: conPachi(
            'Con este botón cambias el tema de todo el sistema, incluidas las tablas y los gráficos. Tu elección queda guardada para la próxima vez que entres.',
            'idea',
          ),
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: ANCLA.perfil,
        popover: {
          title: '🎨 El fondo y el color',
          description: conPachi(
            'En <b>Configuración → Apariencia</b> eliges el fondo del escritorio y el <b>color de acento</b>: el sistema entero lo adopta, hasta este globo que estás leyendo.',
            'escribe',
          ),
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: ANCLA.recientes,
        popover: {
          title: '🕘 Tus reportes recientes',
          description: conPachi(
            'Acá se van apilando los reportes que abriste, del más nuevo al más viejo, para que vuelvas a ellos sin recorrer el menú.',
            'buscar',
          ),
          side: 'top',
          align: 'start',
        },
      },
      {
        element: ANCLA.recientes,
        popover: {
          title: '🎉 Eso es todo',
          description: conPachi(
            'Ya conoces el escritorio. Cuando entre una mejora nueva la vas a encontrar en el panel de novedades, y vuelvo a acompañarte.',
            'celebra',
          ),
          side: 'top',
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

  /** Las novedades publicadas, de la más reciente a la más antigua. */
  readonly novedades: readonly Novedad[] = [...NOVEDADES].sort((a, b) => b.fecha.localeCompare(a.fecha));

  /** Arranca el recorrido guiado de una novedad. */
  iniciar(id: string): void {
    const novedad = this.novedades.find((n) => n.id === id);
    if (!novedad) return;

    this.driverTour.createQuickTour([...novedad.pasos], { popoverClass: 'mis-tour-popover' });
  }

  /** `true` mientras la novedad siga siendo reciente — es lo que pinta la etiqueta "Nuevo". */
  esNueva(novedad: Novedad, ahora = Date.now()): boolean {
    const publicada = Date.parse(novedad.fecha);
    if (Number.isNaN(publicada)) return false;
    return ahora - publicada < DIAS_NOVEDAD_NUEVA * 24 * 60 * 60 * 1000;
  }
}
