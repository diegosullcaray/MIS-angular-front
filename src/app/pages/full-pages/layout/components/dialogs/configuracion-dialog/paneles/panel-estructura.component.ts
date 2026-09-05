import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { PreferenciasService } from '../../../../../../../core/preferencias/aplicacion/preferencias.service';
import { CATALOGO_MODOS_SIDEBAR } from '../../../../../../../core/preferencias/dominio/preferencias.model';
import type { ModoSidebar, VistaExplorador } from '../../../../../../../core/preferencias/dominio/preferencias.model';

interface OpcionVista {
  readonly label: string;
  readonly value: VistaExplorador;
}

/**
 * Pantalla "Estructura": cómo se comporta el menú de sistemas y con qué vista
 * abre el explorador. Los cuatro modos son los mismos que ofrece el layout de
 * PrimeNG (static / slim / overlay / horizontal).
 */
@Component({
  selector: 'app-panel-estructura',
  standalone: true,
  imports: [FormsModule, SelectButtonModule, ToggleSwitchModule],
  templateUrl: './panel-estructura.component.html',
  styleUrl: './paneles.css',
})
export class PanelEstructuraComponent {
  private readonly preferencias = inject(PreferenciasService);

  protected readonly estructura = this.preferencias.estructura;
  protected readonly modos = CATALOGO_MODOS_SIDEBAR;

  // `p-selectbutton` pide un array mutable en `[options]`, así que no va `readonly`.
  protected readonly vistas: OpcionVista[] = [
    { label: 'Cuadrícula', value: 'cuadricula' },
    { label: 'Lista', value: 'lista' },
  ];

  /** El modo delgado es "solo íconos" por definición: ahí el interruptor no aplica. */
  protected readonly etiquetasBloqueadas = computed(() => this.estructura().modoSidebar === 'delgado');

  protected esModo(clave: ModoSidebar): boolean {
    return this.estructura().modoSidebar === clave;
  }

  protected setModo(modo: ModoSidebar): void {
    this.preferencias.setModoSidebar(modo);
  }

  protected setEtiquetas(valor: boolean): void {
    this.preferencias.setEtiquetasSidebar(valor);
  }

  protected setVista(vista: VistaExplorador): void {
    this.preferencias.setVistaExplorador(vista);
  }
}
