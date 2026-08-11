import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "app/shared/shared.module";
import { MaterialModule } from 'app/material/material.module';
import { Rep01DesempenoSocialRoutingModule } from "./rep01-desempeno-social-routing.module";
import { Rep01DesempenoSocialComponent } from "./rep01-desempeno-social.component";

@NgModule({
    imports:[
        Rep01DesempenoSocialRoutingModule,
        CommonModule,
        FormsModule,
        FlexLayoutModule,
        MaterialModule,
        SharedModule,
    ],
    declarations:[Rep01DesempenoSocialComponent],
    //providers:[ModAppService]
})
export class Rep01DesempenoSocialModule{}