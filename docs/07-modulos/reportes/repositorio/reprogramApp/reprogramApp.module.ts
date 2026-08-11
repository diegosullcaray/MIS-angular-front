import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "app/shared/shared.module";
import { MaterialModule } from 'app/material/material.module';
import { reprogramAppRoutingModule } from "./reprogramApp-routing.module";
import { reprogramAppComponent } from "./reprogramApp.component";

@NgModule({
    imports:[
        reprogramAppRoutingModule,
        SharedModule,
        CommonModule,
        FormsModule,
        FlexLayoutModule,
        MaterialModule  
    ],
    declarations:[reprogramAppComponent],
    //providers:[ModAppService]
})
export class reprogramAppModule{}