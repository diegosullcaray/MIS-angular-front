import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "app/shared/shared.module";
import { MaterialModule } from 'app/material/material.module';
import { imrComponent } from "./imr.component";
import { imrRoutingModule } from "./imr-routing.module";

@NgModule({
    imports:[
        imrRoutingModule,
        CommonModule,
        FormsModule,
        FlexLayoutModule,
        MaterialModule,
        SharedModule,
    ],
    declarations:[imrComponent],
    //providers:[ModAppService]
})  
export class imrModule{}