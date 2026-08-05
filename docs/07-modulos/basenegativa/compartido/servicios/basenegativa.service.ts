import { Injectable } from "@angular/core";
import { AntService } from "app/core/data/remote/ant/ant-service.class";
import { IWinderResponse } from "app/core/data/remote/winder/winder.interface";
import { WinderService } from "app/core/data/remote/winder/winder.service";
import { StgAppLoaderService } from "app/shared/components/stg-app-loader/stg-app-loader.service";
import { isNullOrUndefined } from "app/core/helpers/functions.util";
import { UserService } from "app/pages/full-pages/layout/services/user.service";
import { Observable } from "rxjs";
import { environment } from "environments/environment";

@Injectable()
export class ModKaypachaService extends AntService {
    cod_bt: string;
    email: string;
    isAdmin: boolean;

    constructor(private winderService: WinderService, private user: UserService, private loader: StgAppLoaderService) {
        super({
            port: 6302,
            secret: environment.moduleSecrets.app,
            appId: "app"
        }, winderService);
        let profile = this.user.get('profile');
        this.cod_bt = profile.cod_bt;
        this.email = profile.email;
        this.isAdmin = profile.tip_use === 0;
    }

    public openMsg(msg: string) {
        this.loader.open(msg);
    }

    public closeMsg() {
        this.loader.close();
    }

    public getDashboardData(codBT?:string): Observable<IWinderResponse> {
        let fcbt = isNullOrUndefined(codBT)?this.cod_bt:codBT; 
        return this.getSimpleResponseString("kaypacha.dashboard", { cod_bt: fcbt }, "resultado");
    }

    public getUserLists(): Observable<IWinderResponse> {
        return this.getSimpleResponseString("kaypacha.colaboradores", { }, "resultado");
    }
    public getColaboradoresdData_(codBT?:string): Observable<IWinderResponse> {
        let fcbt = isNullOrUndefined(codBT)?this.cod_bt:codBT;
        //console.log(fcbt)
        return this.getSimpleResponseString("kaypacha.colaboradoresData_", { cod_bt: fcbt }, "resultado");
    }
    
    public getColaboradoresdData(codBT?:string): Observable<IWinderResponse> {
        let fcbt = isNullOrUndefined(codBT)?this.cod_bt:codBT;
        //console.log(fcbt)
        return this.getSimpleResponseString("kaypacha.colaboradoresData", { cod_bt: fcbt }, "resultado");
    }
    public getListRanking(codBT?:string): Observable<IWinderResponse> {
        let fcbt = isNullOrUndefined(codBT)?this.cod_bt:codBT;
        //console.log(fcbt)
        return this.getSimpleResponseString("kaypacha.listRanking", { cod_bt: fcbt }, "resultado");
    }
    public getDetalleRanking(codBT?:string): Observable<IWinderResponse> {
        let fcbt = isNullOrUndefined(codBT)?this.cod_bt:codBT;
        //console.log(fcbt)
        return this.getSimpleResponseString("kaypacha.DetalleRanking", { cod_bt: fcbt }, "resultado");
    }
    
}