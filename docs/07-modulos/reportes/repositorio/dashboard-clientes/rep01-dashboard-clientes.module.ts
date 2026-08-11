import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "app/shared/shared.module";
import { MaterialModule } from 'app/material/material.module';
import { Rep01DashboardClientesRoutingModule } from "./rep01-dashboard-clientes-routing.module";
import { Rep01DashboardClientesComponent } from "./rep01-dashboard-clientes.component";

@NgModule({
    imports:[
        Rep01DashboardClientesRoutingModule,
        CommonModule,
        FormsModule,
        FlexLayoutModule,
        MaterialModule,
        SharedModule,
    ],
    declarations:[Rep01DashboardClientesComponent],
    //providers:[ModAppService]
})
export class Rep01DashboardClientesModule{}