import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "app/shared/shared.module";
import { MaterialModule } from 'app/material/material.module';
import { SeguroOptativoComponent } from "./seguro-optativo.component";
import { SeguroOptativoRoutingModule } from "./seguro-optativo-routing.module";

@NgModule({
    imports:[
        SeguroOptativoRoutingModule,
        CommonModule,
        FormsModule,
        FlexLayoutModule,
        MaterialModule,
        SharedModule,
    ],
    declarations:[SeguroOptativoComponent],
    //providers:[ModAppService]
})
export class panelMisionalesModule{}