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
import { CeroCuotasRoutingModule } from "./cero-cuotas.routing.module";
import { CeroCuotasComponent } from "./cero-cuotas.component";

@NgModule({
    imports:[
        CeroCuotasRoutingModule,
        CommonModule,
        FormsModule,
        FlexLayoutModule,
        MaterialModule,
        SharedModule,
        HighchartsChartModule ,
        LeafletModule
    ],
    //declarations:[GestionComercialComponent,DetalleDialogComponent,MapaSimpleComponent],
    declarations:[CeroCuotasComponent],
    //providers:[ModAppService]
})  
export class ceroCuotasModule{}