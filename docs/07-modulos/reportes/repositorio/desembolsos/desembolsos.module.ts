import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "app/shared/shared.module";
import { MaterialModule } from 'app/material/material.module';
import { UsaComeRoutingModule } from "./desembolsos-routing.module";
import { DesembolsosComponent} from "./desembolsos.component";  
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
    declarations:[DesembolsosComponent,components],
    //providers:[ModAppService]
})
export class UsaComeModule{}