import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "app/shared/shared.module";
import { MaterialModule } from 'app/material/material.module';
import { RankingComercialComponent } from "./ranking-comercial.component"; 
import { RankingComercialRoutingModule } from "./ranking-comercial-routing.module";

@NgModule({
    imports:[
        RankingComercialRoutingModule,
        CommonModule,
        FormsModule,
        FlexLayoutModule,
        MaterialModule,
        SharedModule,
    ],
    declarations:[RankingComercialComponent],
    //providers:[ModAppService]
})  
export class rankingcomercialModule{}