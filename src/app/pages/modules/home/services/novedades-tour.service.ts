import { Injectable, inject } from '@angular/core';
import { DriverTourService } from '../../../../shared/services/driver-tour.service';
import type { Novedad } from '../models/novedad.model';

/** Carpeta de las imágenes del personaje que acompaña los recorridos. */
const MASCOTA = '/assets/images/fc/tours/mascota-';

/**
 * Envuelve el texto del paso con el personaje de la marca, que es quien "da"
 * la guía. `description` de driver.js se pinta con `innerHTML` (ver
 * `driver.js.mjs`), así que acepta este marcado; el texto es nuestro, no entra
 * nada del usuario. La imagen va como decorativa: lo que se lee es el texto.
 */
function conMascota(texto: string, pose: 'guia' | 'celebra' | 'saluda' | 'piensa' | 'sorpresa' | 'alerta' | 'feliz' | 'camina' | 'buscar' | 'escribe' | 'trabaja' | 'duda' | 'idea' = 'guia'): string {
  return `<span class="mis-tour-fila"><img class="mis-tour-mascota mis-tour-mascota--${pose}" src="${MASCOTA}${pose}.png" alt="" aria-hidden="true"><span class="mis-tour-texto">${texto}</span></span>`;
}

/**
 * Anclas de los pasos. Son elementos del shell que están siempre en pantalla
 * cuando se mira el Home, así que no hace falta ensuciar las plantillas de los
 * módulos con `id` de tour: se apunta a lo que ya los identifica (el mismo
 * criterio que usan los specs de e2e).
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
    id: 'panel-novedades',
    titulo: 'Panel de novedades',
    resumen: 'Las mejoras del sistema, cada una con su recorrido guiado.',
    icono: 'pi pi-sparkles',
    fecha: '2026-09-09',
    pasos: [
      {
        element: ANCLA.panel,
        popover: {
          title: '✨ Acá viven las novedades',
          description: conMascota(
            '¡Hola! Soy tu guía. En este panel voy dejando cada mejora que entra al sistema, la más nueva arriba.',
            'saluda'
          ),
          side: 'left',
          align: 'start',
        },
      },
      {
        element: ANCLA.panel,
        popover: {
          title: '🖱️ Un clic y te la muestro',
          description: conMascota(
            'Elegí cualquier novedad y te llevo por la pantalla señalando dónde está. Podés cerrar el recorrido cuando quieras con Esc.',
            'guia'
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
          description: conMascota(
            'Abrí este menú y vas a ver tu tarjeta arriba, con tu nombre y tu correo, igual que el selector de perfiles de Chrome.',
            'piensa'
          ),
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: ANCLA.perfil,
        popover: {
          title: '🔄 Cambiar de perfil',
          description: conMascota(
            'Si tenés cuentas asignadas, aparecen abajo en <b>Otros perfiles</b>: un clic cambia de cuenta, sin ventanas de confirmación. Desde ahí mismo volvés a la tuya.',
            'feliz'
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
    resumen: 'Barra de título con semáforo en cada módulo y en cada diálogo.',
    icono: 'pi pi-window-maximize',
    fecha: '2026-09-05',
    pasos: [
      {
        element: ANCLA.rail,
        popover: {
          title: '🗂️ Elegí un sistema',
          description: conMascota(
            'Desde esta barra entrás a cada sistema. Lo que abras se muestra dentro de una ventana con su propia barra de título.',
            'camina'
          ),
          side: 'right',
          align: 'start',
        },
      },
      {
        element: ANCLA.rail,
        popover: {
          title: '🚦 El semáforo de la ventana',
          description: conMascota(
            'En esa barra vas a encontrar las tres luces: la <b>roja</b> cierra y vuelve al inicio, la <b>amarilla</b> va hacia atrás y la <b>verde</b> abre a pantalla completa. Los diálogos ahora usan el mismo semáforo.',
            'alerta'
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
    resumen: 'Se abren solo cuando hay algo sin leer, y los reabrís cuando quieras.',
    icono: 'pi pi-megaphone',
    fecha: '2026-09-02',
    pasos: [
      {
        element: ANCLA.comunicados,
        popover: {
          title: '📣 Los comunicados',
          description: conMascota(
            'Ya no aparecen en cada ingreso: el aviso salta solo cuando hay uno sin leer, y el puntito celeste te avisa. Desde este botón lo volvés a abrir cuando quieras.',
            'sorpresa'
          ),
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: ANCLA.perfil,
        popover: {
          title: '🔕 Si preferís no verlos',
          description: conMascota(
            'En <b>Configuración → Anuncios</b> podés apagarlos del todo. Entrás desde este menú.',
            'trabaja'
          ),
          side: 'bottom',
          align: 'end',
        },
      },
    ],
  },
  {
    id: 'escritorio',
    titulo: 'Tu escritorio de inicio',
    resumen: 'Modo claro y oscuro, y los últimos reportes que abriste.',
    icono: 'pi pi-desktop',
    fecha: '2026-08-28',
    pasos: [
      {
        element: ANCLA.tema,
        popover: {
          title: '🌗 Claro u oscuro',
          description: conMascota(
            'Con este botón cambiás el tema de todo el sistema. Queda guardado para la próxima vez que entres.',
            'idea'
          ),
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: ANCLA.recientes,
        popover: {
          title: '🕘 Tus reportes recientes',
          description: conMascota(
            'Acá se van apilando los reportes que abriste, del más nuevo al más viejo, para que vuelvas a ellos sin recorrer el menú.',
            'buscar'
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
