import { Injectable } from '@angular/core';
import { driver, DriveStep, Config } from 'driver.js';

export interface TourConfig extends Omit<Config, 'onPopoverRender'> {
  customButtonClasses?: {
    next?: string[];
    prev?: string[];
    close?: string[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class DriverTourService {
  private driverObj: any = null;

  constructor() {}

  /** Inicia un tour interactivo utilizando Driver.js */
  startTour(config: TourConfig): void {
    this.destroyCurrentTour();

    const { customButtonClasses, ...driverConfig } = config;

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

    const defaultConfig: Partial<Config> = {
      animate: true,
      smoothScroll: true,
      allowKeyboardControl: true,
      skipMissingElement: true,
      stagePadding: isMobile ? 4 : 8,
      stageRadius: 10,
      overlayColor: 'rgba(15, 23, 42, 0.65)',
      allowClose: true,
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      nextBtnText: 'Siguiente',
      prevBtnText: 'Anterior',
      doneBtnText: 'Finalizar',
      progressText: '{{current}} de {{total}}',
      onDestroyStarted: (element, step, opts) => {
        if (driverConfig.onDestroyStarted) {
          driverConfig.onDestroyStarted(element, step, opts);
        }
        this.driverObj = null;
        if (opts?.driver && typeof opts.driver.destroy === 'function') {
          opts.driver.destroy();
        }
      },
      onDestroyed: (element, step, opts) => {
        if (driverConfig.onDestroyed) {
          driverConfig.onDestroyed(element, step, opts);
        }
        this.driverObj = null;
      },
    };

    const sanitizedSteps = isMobile && driverConfig.steps
      ? driverConfig.steps.map((step) => {
          if (!step.popover) return step;
          const popover = { ...step.popover };
          // En móvil, la barra de sistemas vive fija en el borde inferior.
          if (step.element === '#tour-sidebar-icons') {
            popover.side = 'top';
            popover.align = 'center';
          } else if (popover.side === 'left' || popover.side === 'right') {
            // En móvil (<640px) no hay margen horizontal suficiente; ubicar verticalmente.
            popover.side = 'bottom';
            popover.align = 'center';
          }
          return { ...step, popover };
        })
      : driverConfig.steps;

    const finalConfig: Config = {
      ...defaultConfig,
      ...driverConfig,
      ...(sanitizedSteps ? { steps: sanitizedSteps } : {}),
    };

    this.driverObj = driver(finalConfig);
    this.driverObj.drive();
  }

  /** Crea un tour rápido a partir de un arreglo de pasos (DriveStep) */
  createQuickTour(steps: DriveStep[], options?: Partial<TourConfig>): void {
    const config: TourConfig = {
      steps,
      ...options,
    };

    this.startTour(config);
  }

  /** Destruye el tour activo limpiando referencias y el DOM */
  destroyCurrentTour(): void {
    if (this.driverObj) {
      const instance = this.driverObj;
      this.driverObj = null;
      try {
        instance.destroy?.();
      } catch {
        // El tour ya estaba destruido: no hay nada que limpiar.
      }
    }
  }

  /** Fuerza el cierre del tour y elimina popovers residuales si los hubiera */
  forceClose(): void {
    this.destroyCurrentTour();
    const overlays = document.querySelectorAll('.driver-overlay, .driver-popover');
    overlays.forEach((overlay) => overlay.remove());
  }

  /** Verifica si existe un tour activo */
  isActive(): boolean {
    return this.driverObj !== null;
  }
}
