import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "app/shared/shared.module";
import { MaterialModule } from 'app/material/material.module';
import { CarterizacionCapComRoutingModule } from "./carterizacion-cap-com-routing.module";
import { CarterizacionCapComComponent} from "./carterizacion-cap-com.component";  
const components=[  
];
@NgModule({
    imports:[
        CarterizacionCapComRoutingModule,
        CommonModule,
        FormsModule,  
        FlexLayoutModule,
        MaterialModule, 
        SharedModule,
    ],
    declarations:[CarterizacionCapComComponent,components],
    //providers:[ModAppService]
})
export class CarterizacionCapComModule{}