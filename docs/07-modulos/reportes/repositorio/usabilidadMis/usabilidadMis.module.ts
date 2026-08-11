import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "app/shared/shared.module";
import { MaterialModule } from 'app/material/material.module';
import { usabilidadMisRoutingModule } from "./usabilidadMis-routing.module";
import { usabilidadMisComponent } from "./usabilidadMis.component";
import { HighchartsChartModule } from "highcharts-angular"; 


@NgModule({
    imports:[
        usabilidadMisRoutingModule,
        SharedModule,
        CommonModule,
        FormsModule,
        FlexLayoutModule,
        MaterialModule,
        HighchartsChartModule  
    ],
    declarations:[usabilidadMisComponent],
    //providers:[ModAppService]
})

export class usabilidadMisModule{}