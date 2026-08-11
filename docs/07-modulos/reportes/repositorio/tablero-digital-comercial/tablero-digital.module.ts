import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "app/shared/shared.module";
import { MaterialModule } from 'app/material/material.module';
import { TableroDigitalRoutingModule } from "./tablero-digital-routing.module";
import { tableroDigitalComponent } from "./tablero-digital.component";

@NgModule({
    imports:[
        TableroDigitalRoutingModule,
        CommonModule,
        FormsModule,
        FlexLayoutModule,
        MaterialModule,
        SharedModule,
    ],
    declarations:[tableroDigitalComponent],
    //providers:[ModAppService]
})
export class tableroDigitalModule{}