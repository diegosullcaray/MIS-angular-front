import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "app/shared/shared.module";
import { MaterialModule } from 'app/material/material.module';
import { UsaComeMRoutingModule } from "./usa_come-m-routing.module";
import { UsaComeMComponent } from "./usa_come-m.component";
import { DetalleMComponent } from "./detalle/detalle-m.component";
import { DetalleDialogMComponent } from "./detalle/detalle-dialog-m.component";
const components=[ 
    DetalleMComponent,
    DetalleDialogMComponent, 
];
@NgModule({
    imports:[
        UsaComeMRoutingModule,
        CommonModule,
        FormsModule,  
        FlexLayoutModule,
        MaterialModule, 
        SharedModule,
    ],
    declarations:[UsaComeMComponent,components],
    //providers:[ModAppService]
})
export class UsaComeMModule{}