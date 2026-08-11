import { NgModule } from "@angular/core";
import { IncentivosDiaRoutingModule } from "./incentivos-dia-routing.module";
import { SharedModule } from "app/shared/shared.module";


@NgModule({
    imports:[
        IncentivosDiaRoutingModule,
        SharedModule,
    ]
})
export class IncentivosDiaModule{}
