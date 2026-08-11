import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "app/shared/shared.module";
import { MaterialModule } from 'app/material/material.module';
  
import { HighchartsChartModule } from "highcharts-angular";
//import { DetalleDialogComponent } from "./detalle/detalle-dialog.component";
import { LeafletModule } from "@asymmetrik/ngx-leaflet";
//import { MapaSimpleComponent } from "./mapa-simple.component";
import { BancaSolidariaRoutingModule } from "./banca-solidaria.routing.module";
import { BancaSolidariaComponent } from "./banca-solidaria.component";

@NgModule({
    imports:[
        BancaSolidariaRoutingModule,
        CommonModule,
        FormsModule,
        FlexLayoutModule,
        MaterialModule,
        SharedModule,
        HighchartsChartModule ,
        LeafletModule
    ],
    //declarations:[GestionComercialComponent,DetalleDialogComponent,MapaSimpleComponent],
    declarations:[BancaSolidariaComponent],
    //providers:[ModAppService]
})  
export class bancasolidariaModule{}