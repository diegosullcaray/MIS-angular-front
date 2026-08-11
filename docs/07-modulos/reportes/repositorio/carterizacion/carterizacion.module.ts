import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "app/shared/shared.module";
import { MaterialModule } from 'app/material/material.module';
import { CarterizacionRoutingModule } from "./carterizacion-routing.module";
import { CarterizacionComponent} from "./carterizacion.component";  
const components=[  
];
@NgModule({
    imports:[
        CarterizacionRoutingModule,
        CommonModule,
        FormsModule,  
        FlexLayoutModule,
        MaterialModule, 
        SharedModule,
    ],
    declarations:[CarterizacionComponent,components],
    //providers:[ModAppService]
})
export class CarterizacionModule{}