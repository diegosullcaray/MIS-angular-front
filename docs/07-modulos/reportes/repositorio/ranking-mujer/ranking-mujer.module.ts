import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "app/shared/shared.module";
import { MaterialModule } from 'app/material/material.module';
import { rankingMujerComponent } from "./ranking-mujer.component";
import { rankingMujerRoutingModule } from "./ranking-mujer-routing.module";

@NgModule({
    imports:[
        rankingMujerRoutingModule,
        CommonModule,
        FormsModule,
        FlexLayoutModule,
        MaterialModule,
        SharedModule,
    ],
    declarations:[rankingMujerComponent],
    //providers:[ModAppService]
})
export class rankingMujerModule{}