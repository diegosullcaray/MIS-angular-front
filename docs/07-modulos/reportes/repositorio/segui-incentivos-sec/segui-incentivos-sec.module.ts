import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "app/shared/shared.module";
import { MaterialModule } from 'app/material/material.module';
import { SeguiIncentivosSecRoutingModule } from "./segui-incentivos-sec-routing.module";
import { SeguiIncentivosSecComponent } from "./segui-incentivos-sec.component";

@NgModule({
    imports:[
        SeguiIncentivosSecRoutingModule,
        CommonModule,
        FormsModule,
        FlexLayoutModule,
        MaterialModule,
        SharedModule,
    ],
    declarations:[SeguiIncentivosSecComponent],
    //providers:[ModAppService]
})
export class SeguiIncentivosSecModule{}