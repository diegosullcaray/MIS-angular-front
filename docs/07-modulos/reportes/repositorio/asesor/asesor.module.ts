import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "app/shared/shared.module";
import { MaterialModule } from 'app/material/material.module';
import { AsesorComponent} from "./asesor.component";
import { AsesorRoutingModule } from "./asesor-routing.module";
import { NgChartsModule } from "ng2-charts";

@NgModule({
    imports:[
        AsesorRoutingModule,
        CommonModule,
        FormsModule,
        FlexLayoutModule,
        MaterialModule,
        SharedModule,
        NgChartsModule
        
    ],
    declarations:[AsesorComponent],
    //providers:[ModAppService]
})  
export class AsesorModule{}