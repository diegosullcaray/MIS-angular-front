import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "app/shared/shared.module";
import { MaterialModule } from 'app/material/material.module';
import { SeguroComRoutingModule } from "./seguro-com-routing.module";
import { SeguroComComponent} from "./seguro-com.component";  
const components=[  
];
@NgModule({
    imports:[
        SeguroComRoutingModule,
        CommonModule,
        FormsModule,  
        FlexLayoutModule,
        MaterialModule, 
        SharedModule,
    ],
    declarations:[SeguroComComponent,components],
    //providers:[ModAppService]
})
export class SeguroComModule{}