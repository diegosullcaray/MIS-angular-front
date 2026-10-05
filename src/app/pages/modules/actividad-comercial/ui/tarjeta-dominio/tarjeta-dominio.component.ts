import { Component, input, output } from '@angular/core';
import { NgIconComponent } from '@ng-icons/core';
import { ButtonModule } from 'primeng/button';

/** Contenedor común de las tarjetas del tablero: cabecera con ícono y "Ver detalle", cuerpo y pie proyectados. */
@Component({
  selector: 'app-tarjeta-dominio',
  standalone: true,
  imports: [NgIconComponent, ButtonModule],
  templateUrl: './tarjeta-dominio.component.html',
  styleUrl: './tarjeta-dominio.component.css',
})
export class TarjetaDominioComponent {
  readonly titulo = input.required<string>();
  /** Nombre del ícono (Lucide) ya registrado por la tarjeta que lo usa. */
  readonly icono = input.required<string>();
  /** Pinta el ícono con el tono de alerta (p. ej. mora). */
  readonly alerta = input(false);

  readonly verDetalle = output<void>();
}
