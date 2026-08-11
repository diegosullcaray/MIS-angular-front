import { NgModule } from "@angular/core";
import { SharedModule } from "app/shared/shared.module";
import { HighchartsChartModule } from "highcharts-angular";
import { MonRanCampComponent } from "./mon-ran-camp.component";
import { PrincipalComponent } from "./principal/principal.component";
import { MonRanCampRoutingModule } from "./mon-ran-camp-routing.module";
import { MonRanCampService } from "./compartido/servicios/mon-ran-camp.service";
import { MonRanCampAntService } from "./compartido/servicios/mon-ran-camp-ant.service";
import { DetalleComponent } from "./detalle/detalle.component";

const components=[
    MonRanCampComponent,
    PrincipalComponent,
    DetalleComponent
];

@NgModule({
    imports:[
        MonRanCampRoutingModule,
        SharedModule,
        HighchartsChartModule
    ],
    declarations:[components],
    providers:[MonRanCampService,MonRanCampAntService]
})
export class MonRanCampModule{}