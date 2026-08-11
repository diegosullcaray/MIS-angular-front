import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "app/shared/shared.module";
import { MaterialModule } from 'app/material/material.module';
import { SegurosPasivosComponent } from "./seguros-pasivos.component";
import { SegurosPasivosRoutingModule } from "./seguros-pasivos-routing.module";

@NgModule({
    imports:[
        SegurosPasivosRoutingModule,
        CommonModule,
        FormsModule,
        FlexLayoutModule,
        MaterialModule, 
        SharedModule,
    ],
    declarations:[SegurosPasivosComponent],
    //providers:[ModAppService]
})
export class SegurosPasivosModule{}