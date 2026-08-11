import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "app/shared/shared.module";
import { MaterialModule } from 'app/material/material.module';
import { Rep01MovimientoClientesRoutingModule } from "./rep01-movimiento-clientes-routing.module";
import { Rep01MovimientoClientesComponent } from "./rep01-movimiento-clientes.component";

@NgModule({
    imports:[
        Rep01MovimientoClientesRoutingModule,
        SharedModule,
    ],
    declarations:[Rep01MovimientoClientesComponent],
    //providers:[ModAppService]
})
export class Rep01MovimientoClientesModule{}