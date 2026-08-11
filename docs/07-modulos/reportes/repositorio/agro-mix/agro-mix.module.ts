import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "app/shared/shared.module";
import { MaterialModule } from 'app/material/material.module';
import { AgroMixComponent } from "./agro-mix.component";
import { AgroMixRoutingModule } from "./agro-mix-routing.module";
import { HighchartsChartModule } from "highcharts-angular";
import { DetalleDialogComponent } from "./detalle/detalle-dialog.component";
import { LeafletModule } from "@asymmetrik/ngx-leaflet";
import { MapaSimpleComponent } from "./mapa-simple.component";

@NgModule({
    imports:[
        AgroMixRoutingModule,
        CommonModule,
        FormsModule,
        FlexLayoutModule,
        MaterialModule,
        SharedModule,
        HighchartsChartModule ,
        LeafletModule
    ],
    declarations:[AgroMixComponent,DetalleDialogComponent,MapaSimpleComponent],
    //providers:[ModAppService]
})  
export class agroMixModule{}