import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "app/shared/shared.module";
import { MaterialModule } from 'app/material/material.module';
import { poblacionMisionalComponent } from "./poblacion-misional.component";
import { poblacionMisionalRoutingModule } from "./poblacion-misional-routing.module";

@NgModule({
    imports:[
        poblacionMisionalRoutingModule,
        CommonModule,
        FormsModule,
        FlexLayoutModule,
        MaterialModule,
        SharedModule,
    ],
    declarations:[poblacionMisionalComponent],
    //providers:[ModAppService]
})  
export class poblacionMisionalModule{}