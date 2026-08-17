import { Injectable, inject } from '@angular/core';
import { DriverTourService } from '../../../../shared/services/driver-tour.service';
import type { DriveStep } from 'driver.js';

@Injectable({ providedIn: 'root' })
export class FrameworkEsgTourService {
  private readonly driverTour = inject(DriverTourService);

  /**
   * Inicia el tutorial guiado interactivo para el módulo Cuadro de Mando ESG.
   */
  iniciarTourGuiado(): void {
    const pasos: DriveStep[] = [
      {
        element: '#tour-esg-panel .mis-window-bar',
        popover: {
          title: '🌱 Cuadro de Mando ESG',
          description: 'Bienvenido al módulo Framework ESG. Consulta la gestión de métricas e indicadores de sostenibilidad.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '#tour-esg-usuarios-btn',
        popover: {
          title: '👥 Gestión de Usuarios',
          description: 'Permite administrar los usuarios asignados y permisos de edición para cada métrica ESG.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '#tour-esg-tour-btn',
        popover: {
          title: '❓ Tour Guiado',
          description: 'Haz clic aquí en cualquier momento para reiniciar este recorrido guiado por las funciones del módulo.',
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: '#tour-esg-tabs',
        popover: {
          title: '🗂️ Categorías ESG',
          description: 'Navega entre la Portada de resumen y las 4 dimensiones principales: Medioambiente, Social Empleado, Social Cliente y Gobierno.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '#tour-esg-portada-tabla',
        popover: {
          title: '📊 Cuadro Resumen por Estado',
          description: 'Visualiza la cantidad total de métricas clasificadas por estado (Vigentes, Por Vencer, Vencidos) en cada dimensión.',
          side: 'top',
          align: 'center',
        },
      },
      {
        element: '#tour-esg-metricas-tabla',
        popover: {
          title: '📋 Tabla de Métricas y Acciones',
          description: 'En cada categoría encontrarás la lista de métricas, valores históricos por periodo y acciones de edición o consulta detallada.',
          side: 'top',
          align: 'center',
        },
      },
    ];

    this.driverTour.createQuickTour(pasos);
  }
}
