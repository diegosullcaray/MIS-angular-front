import { Injectable, inject } from '@angular/core';
import { DriverTourService } from '../../../../shared/services/driver-tour.service';
import type { DriveStep } from 'driver.js';

/** Servicio de tour guiado interactivo para el módulo Kaypacha. */
@Injectable({ providedIn: 'root' })
export class KaypachaTourService {
  private readonly driverTour = inject(DriverTourService);

  /** Inicia el tour guiado por las secciones del tablero. */
  iniciarTourGuiado(): void {
    const pasos: DriveStep[] = [
      {
        element: '#tour-kaypacha-header',
        popover: {
          title: '🚀 Tablero Kaypacha',
          description: 'Bienvenido al tablero principal de Kaypacha. Consulta el desempeño y métricas en tiempo real.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '#tour-kaypacha-cambiar-btn',
        popover: {
          title: '👤 Cambiar Colaborador',
          description: 'Abre el buscador global para consultar el tablero de cualquier asesor o colaborador.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '#tour-kaypacha-limpiar-btn',
        popover: {
          title: '🧹 Limpiar Todo',
          description: 'Restablece las vistas y recarga la información por defecto del usuario activo.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '#tour-kaypacha-tour-btn',
        popover: {
          title: '❓ Tour Guiado',
          description: 'Haz clic aquí en cualquier momento para reiniciar este recorrido guiado.',
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: '#tour-kaypacha-asesor-info',
        popover: {
          title: '🪪 Ficha del Asesor y Medalla',
          description: 'Visualiza el asesor activo, su cargo y la medalla alcanzada.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '#tour-kaypacha-kpi-cards',
        popover: {
          title: '📊 Puntaje Final y Posición',
          description: 'Revisa de un vistazo el puntaje promedio final obtenido y la posición actual.',
          side: 'left',
          align: 'center',
        },
      },
      {
        element: '#tour-kaypacha-puntos-acumulados',
        popover: {
          title: '⭐ Puntos Acumulados',
          description: 'Consulta los puntos base, transacciones digitales y usabilidad.',
          side: 'top',
          align: 'center',
        },
      },
      {
        element: '#tour-kaypacha-variables-historicas',
        popover: {
          title: '📈 Variables Históricas',
          description: 'Revisa el historial de desempeño con scroll interno.',
          side: 'top',
          align: 'center',
        },
      },
    ];

    this.driverTour.createQuickTour(pasos);
  }
}
