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
  template: `
    <app-tarjeta-dominio titulo="Desempeño" icono="lucideRadar" (verDetalle)="verDetalle.emit()">
      <div class="grid min-h-0 flex-1 grid-cols-1 items-center gap-4 sm:grid-cols-[30fr_70fr]">
        <div class="flex min-w-0 flex-col items-center gap-1.5 text-center">
          <p-avatar [label]="datos().iniciales" shape="circle" size="xlarge" aria-hidden="true" styleClass="!h-[88px] !w-[88px] !text-[28px] !font-bold" />
          <strong class="text-xs leading-[15px] text-[var(--mis-text-primary)]">{{ datos().nombre }}</strong>
          <span class="text-[11px] text-[var(--mis-text-secondary)]">{{ datos().cargo }}</span>
          <div class="mt-1 flex flex-col items-center">
            <span class="text-[10px] text-[var(--mis-text-secondary)]">Score general</span>
            <div
              class="flex items-center gap-1.5"
              [attr.aria-label]="'Score de desempeño general: ' + datos().score + ' de 100. Calificación ' + datos().calificacion"
            >
              <strong class="text-4xl font-bold leading-10 tracking-tight text-[var(--mis-primary-text)]">{{ datos().score }}</strong>
              <p-tag [value]="datos().calificacion" severity="info" />
            </div>
          </div>
        </div>
        <div class="h-[250px] min-w-0">
          <app-grafico-radar [datos]="radar()" />
        </div>
      </div>
    </app-tarjeta-dominio>
  `,
  styles: [':host { display: block; min-width: 0; }'],
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
