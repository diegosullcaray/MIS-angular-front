import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "app/shared/shared.module";
import { MaterialModule } from 'app/material/material.module';
import { UsaComeRoutingModule } from "./desembolsos-m-routing.module";
import { DesembolsosMComponent} from "./desembolsos-m.component";  
const components=[  
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
    declarations:[DesembolsosMComponent,components],
    //providers:[ModAppService]
})
export class UsaComeModule{}