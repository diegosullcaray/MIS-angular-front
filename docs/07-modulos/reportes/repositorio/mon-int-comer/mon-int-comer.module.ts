import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "app/shared/shared.module";
import { MaterialModule } from 'app/material/material.module';
import { MonIntComerComponent } from "./mon-int-comer.component";
import { MonIntComerRoutingModule } from "./mon-int-comer-routing.module";

@NgModule({
    imports:[
        MonIntComerRoutingModule,
        CommonModule,
        FormsModule,
        FlexLayoutModule,
        MaterialModule, 
        SharedModule,
    ],
    declarations:[MonIntComerComponent],
    //providers:[ModAppService]
})
export class MonIntComerModule{}