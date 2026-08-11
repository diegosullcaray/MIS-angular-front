import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "app/shared/shared.module";
import { MaterialModule } from 'app/material/material.module';
import { UsaComeRoutingModule } from "./usa_come-routing.module";
import { UsaComeComponent } from "./usa_come.component";
import { DetalleComponent } from "./detalle/detalle.component";
import { DetalleDialogComponent } from "./detalle/detalle-dialog.component";
const components=[ 
    DetalleComponent,
    DetalleDialogComponent, 
];
@NgModule({
    imports:[
        UsaComeRoutingModule,
        CommonModule,
        FormsModule,  
        FlexLayoutModule,
        MaterialModule, 
        SharedModule,
    ],
    declarations:[UsaComeComponent,components],
    //providers:[ModAppService]
})
export class UsaComeModule{}