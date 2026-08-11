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
import { GestionComercialRoutingModule } from "./gestion-comercial.routing.module";
import { GestionComercialComponent } from "./gestion-comercial.component";

@NgModule({
    imports:[
        GestionComercialRoutingModule,
        CommonModule,
        FormsModule,
        FlexLayoutModule,
        MaterialModule,
        SharedModule,
        HighchartsChartModule ,
        LeafletModule
    ],
    //declarations:[GestionComercialComponent,DetalleDialogComponent,MapaSimpleComponent],
    declarations:[GestionComercialComponent],
    //providers:[ModAppService]
})  
export class gestionComercialModule{}