import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "app/shared/shared.module";
import { MaterialModule } from 'app/material/material.module';
import { zplantillaComponent } from "./zplantilla.component";
import { zplantillaRoutingModule } from "./zplantilla-routing.module";

@NgModule({
    imports:[
        zplantillaRoutingModule,
        CommonModule,
        FormsModule,
        FlexLayoutModule,
        MaterialModule,
        SharedModule,
    ],
    declarations:[zplantillaComponent],
    //providers:[ModAppService]
})  
export class zplantillaModule{}