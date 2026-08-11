import { Injectable } from '@angular/core';
import { AntService } from 'app/core/data/remote/ant/ant-service.class';
import { Strand } from 'app/core/data/remote/winder/strand.class';
import { WinderService } from 'app/core/data/remote/winder/winder.service';
import { isNullOrUndefined } from 'app/core/helpers/functions.util';
import { UserService } from 'app/pages/full-pages/layout/services/user.service';
import { environment } from 'environments/environment';

@Injectable()
export class ModSecService extends AntService {

    constructor(private winderService: WinderService, private userService: UserService) {
        super({
            port: 5301,
            secret: environment.moduleSecrets.secciones,
            appId: "secciones",
        },winderService);
    }

    public getSecList(email:string){
        let s = new Strand("sec_list2", "result_sectorista");
        s.pushToPayload("email", email);
        return this.getResponseString(s);
    }

    public getSecListMov(email:string){
        let s = new Strand("sec_list3", "result_sectorista");
        s.pushToPayload("email", email);
        return this.getResponseString(s);
    }

    public updateData(prcCod: string, params?: {}) {
        let s = new Strand("regularUpdate", "result");
        if (!isNullOrUndefined(params)) {
            for (let k in params) {
                let v = params[k];
                s.pushToPayload(k, v);
            }
        }
        s.pushToPayload("cod_rep", prcCod);
        return this.getResponseString(s);
    }

    /*public insertData(prcCod: string, params?: {}) {
        let s = new Strand("regularInsetReport", "result");
        if (!isNullOrUndefined(params)) {
            for (let k in params) {
                let v = params[k];
                s.pushToPayload(k, v);
            }
        }

        s.pushToPayload("email", prcCod);
        return this.callService(s);
    }*/

    public getSelectSingleBody(selCod: string, params?: {}) {
        let s = new Strand("selectSingle", "result");
        if (!isNullOrUndefined(params)) {
            for (let k in params) {
                let v = params[k];
                s.pushToPayload(k, v);
            }
        }
        s.pushToPayload("cod_sel", selCod);
        return this.getResponseString(s);
    }
}