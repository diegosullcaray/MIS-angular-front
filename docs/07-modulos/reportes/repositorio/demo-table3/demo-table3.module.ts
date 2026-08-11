import { NgModule } from "@angular/core";
import { SharedModule } from "app/shared/shared.module";
import { DemoTable3Component } from "./demo-table3.component";
import { DemoTable3RoutingModule } from "./demo-table3-routing.module";
import { StgTable3Service } from "app/shared/components/stg-table3/stg-table3.service";

const components=[
    DemoTable3Component
];

@NgModule({
    imports:[
        DemoTable3RoutingModule,
        SharedModule,
    ],
    declarations:[components],
    providers:[StgTable3Service]
})
export class DemoTable3Module{}