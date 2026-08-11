import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "app/shared/shared.module";
import { MaterialModule } from 'app/material/material.module';
import { agendacomercialRoutingModule } from "./agenda-comercial-routing.module";
import { agendacomercialComponent } from "./agenda-comercial.component";

@NgModule({
    imports:[
        agendacomercialRoutingModule,
        CommonModule,
        FormsModule,
        FlexLayoutModule,
        MaterialModule,
        SharedModule,
    ],
    declarations:[agendacomercialComponent],
    //providers:[ModAppService]
})
export class agendacomercialModule{}