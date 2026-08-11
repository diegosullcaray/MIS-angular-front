import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportCraV2Component } from './report-cra-v2.component';
import { SelectModule } from '../../../select/select.module';
import { TableModule } from '../../../table/table.module';
import { SharedModule } from 'app/shared/shared.module';
const components = [
    ReportCraV2Component
  ]

@NgModule({
    imports: [
      CommonModule,
      SelectModule,
      TableModule,
      SharedModule,
    ],
    declarations: components,
    exports:components

  })
  export class ReportCraV2Module {

  }