import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ColorPickerModule } from 'primeng/colorpicker';
import { SelectButtonModule } from 'primeng/selectbutton';
import { PreferenciasService } from '../../../../../../../core/preferencias/aplicacion/preferencias.service';
import {
  ACENTOS_SUGERIDOS,
  CATALOGO_FONDOS,
  FONDO_PERSONALIZADO,
} from '../../../../../../../core/preferencias/dominio/preferencias.model';
import type { ModoTema, OpcionFondo } from '../../../../../../../core/preferencias/dominio/preferencias.model';

interface OpcionTema {
  readonly label: string;
  readonly value: ModoTema;
}

/**
 * Pantalla "Apariencia" del diálogo de configuración: tema, fondo del
 * escritorio y color de acento.
 *
 * No guarda ni pinta nada por su cuenta — todo pasa por `PreferenciasService`,
 * que persiste y aplica. Acá solo vive la presentación.
 */
@Component({
  selector: 'app-panel-apariencia',
  standalone: true,
  imports: [FormsModule, ButtonModule, ColorPickerModule, SelectButtonModule],
  templateUrl: './panel-apariencia.component.html',
  styleUrl: './paneles.css',
})
export class PanelAparienciaComponent {
  private readonly preferencias = inject(PreferenciasService);

  protected readonly apariencia = this.preferencias.apariencia;
  protected readonly esPorDefecto = this.preferencias.esPorDefecto;

  protected readonly fondos = CATALOGO_FONDOS;
  protected readonly acentos = ACENTOS_SUGERIDOS;
  protected readonly clavePersonalizado = FONDO_PERSONALIZADO;

  // `p-selectbutton` pide un array mutable en `[options]`, así que no va `readonly`.
  protected readonly temas: OpcionTema[] = [
    { label: 'Claro', value: 'claro' },
    { label: 'Oscuro', value: 'oscuro' },
    { label: 'Sistema', value: 'sistema' },
  ];

  /** El selector de color solo tiene sentido con el fondo personalizado elegido. */
  protected readonly fondoPersonalizadoActivo = computed(() => this.apariencia().fondo === FONDO_PERSONALIZADO);

  /** Cómo se dibuja la muestra de cada fondo en la grilla. */
  protected muestraDe(fondo: OpcionFondo): string {
    return fondo.clave === FONDO_PERSONALIZADO ? this.apariencia().colorFondo : fondo.muestra;
  }

  protected esFondo(clave: string): boolean {
    return this.apariencia().fondo === clave;
  }

  protected elegirFondo(clave: string): void {
    this.preferencias.setFondo(clave);
  }

  /** Elegir un color implica quedarse en el fondo personalizado: si no, no se vería. */
  protected elegirColorFondo(color: string): void {
    this.preferencias.setColorFondo(color);
    this.preferencias.setFondo(FONDO_PERSONALIZADO);
  }

  protected setTema(tema: ModoTema): void {
    this.preferencias.setTema(tema);
  }

  protected setAcento(acento: string): void {
    this.preferencias.setAcento(acento);
  }

  protected restablecer(): void {
    this.preferencias.restablecer();
  }
}
