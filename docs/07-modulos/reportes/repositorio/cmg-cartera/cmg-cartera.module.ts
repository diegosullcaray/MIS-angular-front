import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "app/shared/shared.module";
import { MaterialModule } from 'app/material/material.module';
import { CmgCarteraComponent } from "./cmg-cartera.component";
import { CmgcarteraRoutingModule } from "./cmg-cartera-routing.module";

@NgModule({
    imports:[
        CmgcarteraRoutingModule,
        CommonModule,
        FormsModule,
        FlexLayoutModule,
        MaterialModule,
        SharedModule,
    ],
    declarations:[CmgCarteraComponent],
    //providers:[ModAppService]
})  
export class cmgcarteraModule{}