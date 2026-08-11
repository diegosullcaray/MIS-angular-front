import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "app/shared/shared.module";
import { MaterialModule } from 'app/material/material.module';
import { DetMoraComponent } from "./det-mora.component";
import { DetmoraRoutingModule } from "./det-mora-routing.module";


@NgModule({
    imports:[
        DetmoraRoutingModule,
        CommonModule,
        FormsModule,
        FlexLayoutModule,
        MaterialModule,
        SharedModule,
    ],
    declarations:[DetMoraComponent],
    //providers:[ModAppService]
})  
export class detmoraModule{}
