import { Component, effect, inject, untracked } from '@angular/core';
import { Location } from '@angular/common';
import { NavegacionSistemasService } from '../../services/navegacion-sistemas.service';

/**
 * Componente comodín para rutas que no existen físicamente en Angular,
 * pero que corresponden a carpetas del Explorador (creadas vía replaceState).
 * Su única función es decirle al Layout "abre el explorador" y salir del medio.
 */
@Component({
  selector: 'app-explorador-aterrizaje',
  standalone: true,
  template: ``, // No tiene UI, el shell se encarga de pintar la cortina
})
export class ExploradorAterrizajeComponent {
  private readonly navegacion = inject(NavegacionSistemasService);
  private readonly location = inject(Location);

  constructor() {
    // Cuando el usuario recarga, el menú (STG) tarda unos instantes en resolverse.
    // Usamos effect para esperar pasivamente a que existan iconos más allá del "Inicio" base.
    effect(() => {
      const iconos = this.navegacion.iconos();
      if (iconos.length <= 1) return; // Todavía no cargó el menú del backend

      untracked(() => {
        const url = this.location.path();
        this.navegacion.restaurarDesdeUrl(url);
      });
    });
  }
}
