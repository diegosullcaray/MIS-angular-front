import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportCraV1p7Component } from './report-cra-v1p7.component';
import { SelectModule } from '../../../select/select.module';
import { TableModule } from '../../../table/table.module';
import { GraphicModule } from '../../../graphic/graphic.module';
import { SharedModule } from 'app/shared/shared.module';

const components = [
  ReportCraV1p7Component
  ]

@NgModule({
    imports: [
      CommonModule,
      SelectModule,
      TableModule,
      GraphicModule,
      SharedModule,
    ],
    declarations: components,
    exports:components

  })
  export class ReportCraV1P7Module {

  }