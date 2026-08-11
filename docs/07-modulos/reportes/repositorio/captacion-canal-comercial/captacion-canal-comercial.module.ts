import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "app/shared/shared.module";
import { MaterialModule } from 'app/material/material.module';
import { CaptacionCanalComercialComponent } from './captacion-canal-comercial.component';
import { CaptacionCanalComercialRoutingModule } from './captacion-canal-comercial-routing.module';

@NgModule({
    imports:[
        CaptacionCanalComercialRoutingModule,
        CommonModule,
        FormsModule,
        FlexLayoutModule,
        MaterialModule,
        SharedModule,
    ],
    declarations:[CaptacionCanalComercialComponent],
    //providers:[ModAppService]
})
export class CaptacionCanalComercialModule{}