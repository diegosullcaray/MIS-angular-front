import { Injectable, inject } from '@angular/core';
import { DriverTourService } from '../../../../shared/services/driver-tour.service';
import type { DriveStep } from 'driver.js';

@Injectable({ providedIn: 'root' })
export class RankingTourService {
  private readonly driverTour = inject(DriverTourService);

  /**
   * Inicia el tutorial guiado interactivo para el módulo Ranking Kaypacha.
   */
  iniciarTourGuiado(): void {
    const pasos: DriveStep[] = [
      {
        element: '#tour-sidebar-icons',
        popover: {
          title: '🗂️ Categorías del Ranking',
          description: 'Vuelve a hacer clic en el ícono de Ranking Kaypacha cuando quieras para explorar y cambiar entre sus diferentes categorías.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '#tour-ranking-panel .mis-window-bar',
        popover: {
          title: '🏆 Módulo Ranking Kaypacha',
          description: 'Consulta el ranking en tiempo real, desglose por agencias, zonas y metas alcanzadas en la categoría activa.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '#tour-info-btn',
        popover: {
          title: 'ℹ️ Reglamento y Términos',
          description: 'Haz clic en este ícono palpitante en cualquier momento para consultar los 5 términos y condiciones del ranking.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '#tour-filtros-btn',
        popover: {
          title: '🔍 Panel de Filtros',
          description: 'Segmenta los resultados por Red, Zona, Agencia y límite de posiciones para realizar análisis detallados.',
          side: 'left',
          align: 'center',
        },
      },
      {
        element: '#tour-ranking-tabla',
        popover: {
          title: '📊 Tablas de Posiciones y Scroll',
          description: 'Las tablas destacan las primeras posiciones. Utiliza la barra de desplazamiento vertical para consultar las posiciones restantes.',
          side: 'top',
          align: 'center',
        },
      },
    ];

    this.driverTour.createQuickTour(pasos);
  }
}
