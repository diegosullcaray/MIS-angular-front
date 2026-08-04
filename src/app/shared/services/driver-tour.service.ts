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
  private overlayClickBlocker?: (ev: Event) => void;
  private styleElement?: HTMLStyleElement;

  constructor() {}

  /**
   * Inyecta estilos CSS para bloquear interacciones con elementos resaltados
   */
  private injectTourStyles(): void {
    if (this.styleElement) return;

    this.styleElement = document.createElement('style');
    this.styleElement.id = 'driver-tour-block-interactions';
    this.styleElement.textContent = `
      /* Bloquear interacciones en elementos resaltados por el tour */
      .driver-active-element {
        pointer-events: none !important;
      }

      /* Permitir interacciones solo en el popover del tour */
      .driver-popover,
      .driver-popover * {
        pointer-events: auto !important;
      }

      /* Asegurar que el overlay bloquee todos los clicks */
      .driver-overlay {
        pointer-events: auto !important;
      }
    `;
    document.head.appendChild(this.styleElement);
  }

  /**
   * Remueve los estilos CSS inyectados
   */
  private removeTourStyles(): void {
    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
      this.styleElement = undefined;
    }
  }

  /**
   * Configuración común de popoverRender para aplicar clases a los botones
   */
  private getPopoverRenderFunction(
    customClasses?: TourConfig['customButtonClasses'],
  ) {
    return (popover: any) => {
      setTimeout(() => {
        const popoverElement = popover.wrapper || popover;

        // Clases por defecto
        const defaultClasses = {
          next: ['p-button', 'btn-primary', 'btn-md'],
          prev: ['p-button', 'btn-secondary', 'btn-md'],
          close: ['p-button', 'btn-danger', 'btn-sm'],
        };

        // Combinar con clases personalizadas si se proporcionan
        const classes = {
          next: customClasses?.next || defaultClasses.next,
          prev: customClasses?.prev || defaultClasses.prev,
        };

        // Aplicar clases a los botones
        const nextBtn = popoverElement.querySelector(
          '.driver-popover-next-btn',
        );
        const prevBtn = popoverElement.querySelector(
          '.driver-popover-prev-btn',
        );

        if (nextBtn) {
          nextBtn.classList.add(...classes.next);
        }
        if (prevBtn) {
          prevBtn.classList.add(...classes.prev);
        }
      }, 0);
    };
  }

  private installOverlayClickBlocker(): void {
    if (this.overlayClickBlocker) return;

    this.overlayClickBlocker = (ev: Event) => {
      const target = ev.target as Element | null;
      if (!target) return;

      // No interferir con clicks dentro del popover (botones Next/Prev/Close)
      if (target.closest('.driver-popover')) {
        return;
      }

      // Bloquear clicks sobre el overlay y elementos resaltados
      if (target.closest('.driver-overlay') || target.closest('.driver-active-element')) {
        ev.preventDefault();
        ev.stopPropagation();
        ev.stopImmediatePropagation();
      }
    };

    // Captura para ejecutarse antes que los handlers internos de driver.js.
    // Bloquear todos los eventos de interacción
    const events = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click', 
                     'touchstart', 'touchend', 'dblclick', 'contextmenu'];
    
    events.forEach(eventType => {
      document.addEventListener(eventType, this.overlayClickBlocker!, true);
    });
  }

  private removeOverlayClickBlocker(): void {
    if (!this.overlayClickBlocker) return;
    
    const events = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click', 
                     'touchstart', 'touchend', 'dblclick', 'contextmenu'];
    
    events.forEach(eventType => {
      document.removeEventListener(eventType, this.overlayClickBlocker!, true);
    });
    
    this.overlayClickBlocker = undefined;
  }

  /**
   * Inicia un tour con configuración personalizada
   */
  startTour(config: TourConfig): void {
    this.destroyCurrentTour();

    // Inyectar estilos para bloquear interacciones
    this.injectTourStyles();

    // Instalar el blocker ANTES de inicializar driver.js para que
    // nuestros listeners en captura corran antes que los internos.
    this.installOverlayClickBlocker();

    // Extraer customButtonClasses de la configuración
    const { customButtonClasses, ...driverConfig } = config;

    // Configuración por defecto
    const defaultConfig: Partial<Config> = {
      allowClose: false,
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      nextBtnText: 'Siguiente',
      prevBtnText: 'Anterior',
      doneBtnText: 'Finalizar',
      progressText: '{{current}} de {{total}}',
      onPopoverRender: this.getPopoverRenderFunction(customButtonClasses),
      onDestroyStarted: (element?: any, step?: any, options?: any) => {
        this.destroyCurrentTour();
        // Ejecutar callback personalizado si existe
        if (driverConfig.onDestroyStarted) {
          driverConfig.onDestroyStarted(element, step, options);
        }
      },
    };

    // Combinar configuraciones
    const finalConfig = {
      ...defaultConfig,
      ...driverConfig,
      onPopoverRender: this.getPopoverRenderFunction(customButtonClasses),
      onDestroyStarted: defaultConfig.onDestroyStarted,
      onHighlighted: (element?: any, step?: any, opts?: any) => {
        this.installOverlayClickBlocker();
        if (driverConfig.onHighlighted) {
          driverConfig.onHighlighted(element, step, opts);
        }
      },
      onDestroyed: (element?: any, step?: any, opts?: any) => {
        this.removeOverlayClickBlocker();
        if (driverConfig.onDestroyed) {
          driverConfig.onDestroyed(element, step, opts);
        }
      },
    };

    this.driverObj = driver(finalConfig);
    this.driverObj.drive();
  }

  /**
   * Crea un tour rápido con pasos predefinidos
   */
  createQuickTour(steps: DriveStep[], options?: Partial<TourConfig>): void {
    const config: TourConfig = {
      steps,
      ...options,
      onDestroyStarted: (element?: any, step?: any, opts?: any) => {
        this.destroyCurrentTour();
        // Ejecutar callback personalizado si existe
        if (options?.onDestroyStarted) {
          options.onDestroyStarted(element, step, opts);
        }
      },
    };

    this.startTour(config);
  }

  /**
   * Destruye el tour actual si existe
   */
  destroyCurrentTour(): void {
    if (this.driverObj) {
      try {
        this.driverObj.destroy();
      } catch (error) {
        console.warn('Error al destruir el tour:', error);
      } finally {
        this.driverObj = null;
        this.removeOverlayClickBlocker();
        this.removeTourStyles();
      }
    }
  }

  /**
   * Fuerza el cierre del tour actual
   */
  forceClose(): void {
    this.destroyCurrentTour();

    // Limpiar cualquier elemento del DOM relacionado con driver.js
    const overlays = document.querySelectorAll(
      '.driver-overlay, .driver-popover',
    );
    overlays.forEach((overlay) => {
      overlay.remove();
    });

    // Asegurar que los estilos se removieron
    this.removeTourStyles();
  }

  /**
   * Verifica si hay un tour activo
   */
  isActive(): boolean {
    return this.driverObj !== null;
  }

  /**
   * Métodos de conveniencia para tours comunes
   */

  /**
   * Tour de bienvenida genérico
   */
  startWelcomeTour(
    title: string = 'Bienvenido',
    description: string = 'Te guiaremos paso a paso',
  ): void {
    this.createQuickTour([
      {
        popover: {
          title: `🎯 ${title}`,
          description,
        },
      },
    ]);
  }

  /**
   * Tour para elementos específicos
   */
  highlightElements(
    elements: Array<{
      selector: string;
      title: string;
      description: string;
      side?: string;
    }>,
  ): void {
    const steps: DriveStep[] = elements.map((element) => ({
      element: element.selector,
      popover: {
        title: element.title,
        description: element.description,
        side: (element.side as any) || 'bottom',
        align: 'start',
      },
    }));

    this.createQuickTour(steps);
  }

  /**
   * Tour con clases de botones personalizadas
   */
  startCustomButtonTour(
    steps: DriveStep[],
    buttonClasses: TourConfig['customButtonClasses'],
  ): void {
    this.createQuickTour(steps, { customButtonClasses: buttonClasses });
  }
}
