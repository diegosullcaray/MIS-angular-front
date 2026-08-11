import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "app/shared/shared.module";
import { MaterialModule } from 'app/material/material.module';
import { AgroMixDComponent } from "./agro-mix-d.component";
import { AgroMixDRoutingModule } from "./agro-mix-d.routing.module";
import { HighchartsChartModule } from "highcharts-angular";
import { DetalleDialogComponent } from "./detalle/detalle-dialog.component";
import { LeafletModule } from "@asymmetrik/ngx-leaflet";
import { MapaSimpleComponent } from "./mapa-simple.component";

@NgModule({
    imports:[
        AgroMixDRoutingModule,
        CommonModule,
        FormsModule,
        FlexLayoutModule,
        MaterialModule,
        SharedModule,
        HighchartsChartModule ,
        LeafletModule
    ],
    declarations:[AgroMixDComponent,DetalleDialogComponent,MapaSimpleComponent],
    //providers:[ModAppService]
})  
export class agroMixDModule{}