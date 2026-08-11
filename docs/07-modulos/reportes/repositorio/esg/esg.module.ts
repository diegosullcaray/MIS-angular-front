import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "app/shared/shared.module";
import { MaterialModule } from 'app/material/material.module';
 
import { EsgRoutingModule } from './esg-routing.module';
import { EsgComponent } from './esg.component';

@NgModule({
    imports:[
        EsgRoutingModule,
        SharedModule,
        CommonModule,
        FormsModule,
        FlexLayoutModule,
        MaterialModule  
    ],
    declarations:[EsgComponent],
    //providers:[ModAppService]
})
export class EsgModule{}