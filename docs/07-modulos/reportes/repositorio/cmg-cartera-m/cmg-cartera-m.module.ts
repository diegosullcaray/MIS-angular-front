import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "app/shared/shared.module";
import { MaterialModule } from 'app/material/material.module';
import { CmgCarteraMComponent } from "./cmg-cartera-m.component";
import { CmgcarteraMRoutingModule } from "./cmg-cartera-m-routing.module";

@NgModule({
    imports:[
        CmgcarteraMRoutingModule,
        CommonModule,
        FormsModule,
        FlexLayoutModule,
        MaterialModule,
        SharedModule,
    ],
    declarations:[CmgCarteraMComponent],
    //providers:[ModAppService]
})  
export class cmgcarteramModule{}