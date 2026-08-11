import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReportCraV5Component } from './report-cra-v5.component';

//import {NgxPaginationModule} from 'ngx-pagination'
import { SelectModule } from '../../../select/select.module';
import { TableModule } from '../../../table/table.module';
import { GraphicModule } from '../../../graphic/graphic.module';

import { SharedModule } from 'app/shared/shared.module';
import { FormsModule } from '@angular/forms';

const components = [
  ReportCraV5Component
]

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    SelectModule,
    TableModule,
    GraphicModule,
    //NgxPaginationModule,
    SharedModule,
  ],
  declarations: components,
  exports:components

})

export class ReportCraV5Module {

}