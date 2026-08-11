import { NgModule } from "@angular/core";
import { SharedModule } from "app/shared/shared.module";
import { HighchartsChartModule } from "highcharts-angular";
import { MonSalidasComponent } from "app/pages/modules/reportes/repositorio/mon-salidas/mon-salidas.component";
import { DetalleComponent } from "app/pages/modules/reportes/repositorio/mon-salidas/detalle/detalle.component";
import { MonSalidasService } from "app/pages/modules/reportes/repositorio/mon-salidas/compartido/servicios/mon-salidas.service";
import { MonSalidasAntService } from "app/pages/modules/reportes/repositorio/mon-salidas/compartido/servicios/mon-salidas-ant.service";
import { MonSalidasRoutingModule } from "./mon-salidas-routing.module";
import { PrincipalComponent } from "./principal/principal.component";
import { DetalleDialogComponent } from "./detalle/detalle-dialog.component";
import { ListaClientesComponent } from "./lista-clientes/lista-clientes.component";
import { DetalleDialogWrapperComponent } from "./detalle/detalle-dialog-wrapper.component";
import { StgTable3Service } from "app/shared/components/stg-table3/stg-table3.service";

const components=[
    MonSalidasComponent,
    PrincipalComponent,
    DetalleComponent,
    DetalleDialogComponent,
    ListaClientesComponent,
    DetalleDialogWrapperComponent
];

@NgModule({
    imports:[
        MonSalidasRoutingModule,
        SharedModule,
        HighchartsChartModule
    ],
    declarations:[components],
    providers:[StgTable3Service,MonSalidasService,MonSalidasAntService]
})
export class MonSalidasModule{}