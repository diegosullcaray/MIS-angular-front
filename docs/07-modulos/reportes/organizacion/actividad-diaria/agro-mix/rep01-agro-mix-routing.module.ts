import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

const routes: Routes = [
    {
        path:'',
        children:[
            {
                path: "agro-mix",
                loadChildren: () => import('../../../repositorio/agro-mix-d/agro-mix-d.module').then(m => m.agroMixDModule)
 
 
            }   
        ]
    } 
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class Rep01AgroMixRoutingModule { }
 