import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "app/shared/shared.module";
import { MaterialModule } from 'app/material/material.module';
import { HighchartsChartModule } from "highcharts-angular";  
import { BasenegativaRoutingModule } from './basenegativa-routing.module';
import { BasenegativaComponent } from './basenegativa.component';
//import { ModKaypachaService } from './compartido/servicios/basenegativa.service'; 
import { BuscadorKaypachaComponent } from "./buscador/buscador.component";
import { ModRepService } from "../reportes/compartido/servicios/mod-rep.service";

//import { ModFrameworkEsgService } from '../framework-esg/compartido/servicios/mod-framework-esg.service';

@NgModule({ 
  imports: [ 
    BasenegativaRoutingModule,
    CommonModule,
    FormsModule,
    FlexLayoutModule, 
    MaterialModule,
    SharedModule,
    HighchartsChartModule // Importamos las rutas que creamos arriba
  ],
  declarations: [ 
    BasenegativaComponent,
    BuscadorKaypachaComponent // Declaramos el componente aquí
  ]
  //,providers: [ModFrameworkEsgService,ModKaypachaService]
  ,providers: [
    ModRepService // <-- AGREGAR AQUÍ PARA QUITAR EL NULLINJECTORERROR
  ]
})
export class BaseNegativaModule { }