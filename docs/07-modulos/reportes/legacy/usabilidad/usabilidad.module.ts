import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UsabilidadRoutingModule } from './usabilidad-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { MaterialModule } from 'app/material/material.module';
import { HighchartsChartModule } from 'highcharts-angular';
import { FlexLayoutModule } from '@angular/flex-layout';


@NgModule({
  declarations: [DashboardComponent],
  imports: [
    CommonModule,
    UsabilidadRoutingModule,
    MaterialModule,
    HighchartsChartModule,
    FlexLayoutModule]
})
export class UsabilidadModule { }
