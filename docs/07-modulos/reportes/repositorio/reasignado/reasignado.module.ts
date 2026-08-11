import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "app/shared/shared.module";
import { MaterialModule } from 'app/material/material.module';
import { reasignadoComponent } from "./reasignado.component";
import { reasignadoRoutingModule } from "./reasignado-routing.module";

@NgModule({
    imports:[
        reasignadoRoutingModule,
        CommonModule,
        FormsModule,
        FlexLayoutModule,
        MaterialModule,
        SharedModule,
    ],
    declarations:[reasignadoComponent],
    //providers:[ModAppService]
})  
export class reasignadoModule{}