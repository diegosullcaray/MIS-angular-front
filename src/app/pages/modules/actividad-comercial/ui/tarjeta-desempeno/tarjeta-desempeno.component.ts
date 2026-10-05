import { Component, computed, input, output } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideRadar } from '@ng-icons/lucide';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { GraficoRadarComponent } from '../../../../../shared/ui/graficos/grafico-radar/grafico-radar.component';
import type { DatosRadar } from '../../../../../shared/ui/graficos/models/grafico-comun.model';
import { COLOR_RADAR_ASESOR, COLOR_RADAR_PROMEDIO } from '../../constantes/actividad-comercial.constantes';
import type { DesempenoAsesor } from '../../models/actividad-comercial.model';
import { TarjetaDominioComponent } from '../tarjeta-dominio/tarjeta-dominio.component';

/** Desempeño: perfil y score del asesor junto a su radar frente al promedio. */
@Component({
  selector: 'app-tarjeta-desempeno',
  standalone: true,
  imports: [TarjetaDominioComponent, GraficoRadarComponent, AvatarModule, TagModule],
  viewProviders: [provideIcons({ lucideRadar })],
  templateUrl: './tarjeta-desempeno.component.html',
  styleUrl: './tarjeta-desempeno.component.css',
})
export class TarjetaDesempenoComponent {
  readonly datos = input.required<DesempenoAsesor>();
  readonly verDetalle = output<void>();

  protected readonly radar = computed<DatosRadar>(() => ({
    ejes: this.datos().ejes.map((eje) => eje.etiqueta),
    maximo: 100,
    series: [
      { nombre: 'Asesor', valores: this.datos().ejes.map((eje) => eje.asesor), color: COLOR_RADAR_ASESOR },
      { nombre: 'Promedio', valores: this.datos().ejes.map((eje) => eje.promedio), color: COLOR_RADAR_PROMEDIO, discontinua: true },
    ],
  }));
}
