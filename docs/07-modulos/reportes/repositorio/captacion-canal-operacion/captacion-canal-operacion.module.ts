import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "app/shared/shared.module";
import { MaterialModule } from 'app/material/material.module';
import { CaptacionCanalOperacionComponent } from './captacion-canal-operacion.component';
import { CaptacionCanalOperacionRoutingModule } from './captacion-canal-operacion-routing.module';

@NgModule({
    imports:[
        CaptacionCanalOperacionRoutingModule,
        CommonModule,
        FormsModule,
        FlexLayoutModule,
        MaterialModule,
        SharedModule,
    ],
    declarations:[CaptacionCanalOperacionComponent],
    //providers:[ModAppService]
})
export class CaptacionCanalOperacionModule{}