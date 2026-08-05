import { Injectable, inject } from '@angular/core';
import { DriverTourService } from '../../../../shared/services/driver-tour.service';
import type { DriveStep } from 'driver.js';

@Injectable({ providedIn: 'root' })
export class KaypachaTourService {
  private readonly driverTour = inject(DriverTourService);

  /**
   * Inicia el tutorial guiado interactivo para el módulo Kaypacha.
   */
  iniciarTourGuiado(): void {
    const pasos: DriveStep[] = [
      {
        element: '#tour-kaypacha-header',
        popover: {
          title: '🚀 Tablero Kaypacha',
          description: 'Bienvenido al tablero principal de Kaypacha. Consulta el desempeño, métricas e indicadores en tiempo real.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '#tour-kaypacha-cambiar-btn',
        popover: {
          title: '👤 Cambiar Colaborador',
          description: 'Abre el buscador global para consultar el tablero de cualquier asesor o colaborador por nombre, cargo o documento.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '#tour-kaypacha-limpiar-btn',
        popover: {
          title: '🧹 Limpiar Todo',
          description: 'Restablece las vistas y recarga la información por defecto del usuario activo sin mantener datos previos.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '#tour-kaypacha-tour-btn',
        popover: {
          title: '❓ Tour Guiado',
          description: 'Haz clic aquí en cualquier momento para reiniciar este recorrido guiado interactivo por el módulo.',
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: '#tour-kaypacha-asesor-info',
        popover: {
          title: '🪪 Ficha del Asesor y Medalla',
          description: 'Visualiza el Asesor activo, su Cargo y la insignia/medalla alcanzada según su desempeño.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '#tour-kaypacha-kpi-cards',
        popover: {
          title: '📊 Puntaje Final y Posición',
          description: 'Revisa de un vistazo el Puntaje Promedio Final obtenido y la Posición actual en la plataforma.',
          side: 'left',
          align: 'center',
        },
      },
      {
        element: '#tour-kaypacha-puntos-acumulados',
        popover: {
          title: '⭐ Puntos Acumulados',
          description: 'Consulta los puntos base, transacciones digitales, usabilidad de app y clientes de la agencia.',
          side: 'top',
          align: 'center',
        },
      },
      {
        element: '#tour-kaypacha-variables-historicas',
        popover: {
          title: '📈 Variables Históricas',
          description: 'Revisa el historial de desempeño. Las primeras 5 filas se muestran directamente con scroll interno para el historial restante.',
          side: 'top',
          align: 'center',
        },
      },
    ];

    this.driverTour.createQuickTour(pasos);
  }
}
