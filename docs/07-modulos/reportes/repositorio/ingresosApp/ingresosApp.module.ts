import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "app/shared/shared.module";
import { MaterialModule } from 'app/material/material.module';
import { ingresosAppRoutingModule } from "./ingresosApp-routing.module";
import { ingresosAppComponent } from "./ingresosApp.component";

@NgModule({
    imports:[
        ingresosAppRoutingModule,
        SharedModule,
        CommonModule,
        FormsModule,
        FlexLayoutModule,
        MaterialModule  
    ],
    declarations:[ingresosAppComponent],
    //providers:[ModAppService]
})
export class ingresosAppModule{}