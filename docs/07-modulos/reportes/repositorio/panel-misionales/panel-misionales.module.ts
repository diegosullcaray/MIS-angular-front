import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "app/shared/shared.module";
import { MaterialModule } from 'app/material/material.module';
import { panelMisionalesRoutingModule } from "./panel-misionales-routing.module";
import { panelMisioanlesComponent } from "./panel-misionales.component";

@NgModule({
    imports:[
        panelMisionalesRoutingModule,
        CommonModule,
        FormsModule,
        FlexLayoutModule, 
        MaterialModule,
        SharedModule,
    ],
    declarations:[panelMisioanlesComponent],
    //providers:[ModAppService]
})
export class panelMisionalesModule{}