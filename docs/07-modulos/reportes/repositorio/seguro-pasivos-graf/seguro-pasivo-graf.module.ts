import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "app/shared/shared.module";
import { MaterialModule } from 'app/material/material.module';
import { SeguroPasivoGrafComponent } from "./seguro-pasivo-graf.component";
import { SeguroPasivoGrafRoutingModule } from "./seguro-pasivo-graf-routing.module";
import { ModRepService } from "../../legacy/support/data/ant-mod-rep.service";
import { ComercialService } from "../../legacy/comercial/comercial.service";
import { ModSecService } from "../../legacy/support/data/ant-mod-sec.service";
 
@NgModule({
    imports:[
        SeguroPasivoGrafRoutingModule,
        CommonModule,
        FormsModule,
        FlexLayoutModule,
        MaterialModule,
        SharedModule,

    ],
    declarations:[SeguroPasivoGrafComponent] ,
    providers: [ModRepService,ComercialService,ModSecService],
    //providers:[ModAppService]
})
export class SeguroPasivoGrafModule{}