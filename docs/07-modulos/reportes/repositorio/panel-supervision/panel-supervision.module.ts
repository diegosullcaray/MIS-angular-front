import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "app/shared/shared.module";
import { MaterialModule } from 'app/material/material.module';
import { PanelSupervisionComponent } from "./panel-supervision.component";
import { PanelSupervisionRoutingModule } from "./panel-supervision-routing.module";

@NgModule({
    imports:[
        PanelSupervisionRoutingModule,
        CommonModule,
        FormsModule,
        FlexLayoutModule,
        MaterialModule,
        SharedModule,
    ],
    declarations:[PanelSupervisionComponent],
    //providers:[ModAppService]
})
export class PanelSupervisionModule{}