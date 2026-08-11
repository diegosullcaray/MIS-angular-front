import { StgAppLoaderService } from "app/shared/components/stg-app-loader/stg-app-loader.service";
 
//import { detalleConfig } from "./detalle.util";
import { cloneObject, isNullOrUndefined } from "app/core/helpers/functions.util"; 
import { formatNumber } from "@angular/common";
import { LayoutService } from "app/pages/full-pages/layout/services/layout.service";
import { ModIncentivos3Service } from "app/pages/modules/incentivos3/compartido/servicios/mod-incentivos3.service";
import { Incentivos3Service } from "app/pages/modules/incentivos3/compartido/servicios/incentivos3.service";
import { ModRepService } from "app/pages/modules/reportes/compartido/servicios/mod-rep.service";
import { MatDialogRef } from "@angular/material/dialog";
import { DetalleDialogMComponent } from "./detalle-dialog-m.component";

export abstract class DetalleBaseMComponent {
    config: any;
    item: any;
    tip_cod: number;
    cod_rel: string;
    des_rel: string;
    des_lab: string

    card: any;
    vars: any;
    rank: any;

    subs: any;

    showCards:boolean;

    showVars: boolean;
    showRank: boolean;

    head1: any;
    head2: any;

    isNav: boolean;
    buffer: any;
    pointer: number;
    disNavLeft: boolean;
    disNavRight: boolean;

    constructor(
        public antRep: ModRepService,
        public loader: StgAppLoaderService,
        public layout: LayoutService,

    ) { }
    init(){ 
        if (this.config) {
            this.config.loading = false;
        }
    }
   
 
}

