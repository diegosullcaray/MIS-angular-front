import { NgModule } from "@angular/core";
import { SharedModule } from "app/shared/shared.module";
import { ReporteDemoRoutingModule } from "./reporte-demo-routing.module";
import { ReporteDemoComponent } from "./reporte-demo.component";

@NgModule({
    imports:[
        ReporteDemoRoutingModule,
        SharedModule,
    ],
    declarations:[ReporteDemoComponent],
    //providers:[ModAppService]
})
export class ReporteDemoModule{}