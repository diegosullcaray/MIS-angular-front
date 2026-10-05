import { Component, OnInit, inject } from '@angular/core';
import { WindowPanelComponent } from '../../../../../shared/ui/window-panel/window-panel.component';
import { InlineErrorComponent } from '../../../../../shared/ui/inline-error/inline-error.component';
import { ListSkeletonComponent } from '../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { TITULO_TABLERO } from '../../constantes/actividad-comercial.constantes';
import { ActividadComercialService } from '../../services/actividad-comercial.service';
import { TarjetaCarteraComponent } from '../../ui/tarjeta-cartera/tarjeta-cartera.component';
import { TarjetaClientesComponent } from '../../ui/tarjeta-clientes/tarjeta-clientes.component';
import { TarjetaDesembolsosComponent } from '../../ui/tarjeta-desembolsos/tarjeta-desembolsos.component';
import { TarjetaDesempenoComponent } from '../../ui/tarjeta-desempeno/tarjeta-desempeno.component';
import { TarjetaMoraComponent } from '../../ui/tarjeta-mora/tarjeta-mora.component';
import { TarjetaSegurosComponent } from '../../ui/tarjeta-seguros/tarjeta-seguros.component';

/** Tablero de Mando del asesor (Actividad Comercial). Contenedor: pide el tablero y reparte cada tarjeta. */
@Component({
  selector: 'app-actividad-comercial-principal',
  standalone: true,
  imports: [
    WindowPanelComponent,
    InlineErrorComponent,
    ListSkeletonComponent,
    TarjetaDesempenoComponent,
    TarjetaDesembolsosComponent,
    TarjetaMoraComponent,
    TarjetaSegurosComponent,
    TarjetaCarteraComponent,
    TarjetaClientesComponent,
  ],
  templateUrl: './principal.component.html',
})
export class PrincipalComponent implements OnInit {
  private readonly service = inject(ActividadComercialService);

  protected readonly titulo = TITULO_TABLERO;
  protected readonly tablero = this.service.tablero;
  protected readonly cargando = this.service.cargando;
  protected readonly error = this.service.error;

  ngOnInit(): void {
    this.consultar();
  }

  protected consultar(): void {
    this.service.consultar();
  }
}
