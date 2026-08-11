import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportCraV1p1Component } from './report-cra-v1p1.component';
import { SelectModule } from '../../../select/select.module';
import { TableModule } from '../../../table/table.module';
import { GraphicModule } from '../../../graphic/graphic.module';
import { SharedModule } from 'app/shared/shared.module';

const components = [
    ReportCraV1p1Component
  ]

@NgModule({
    imports: [
      SharedModule,
      SelectModule,
      TableModule,
      GraphicModule,
      
    ],
    declarations: components,
    exports:components

  })
  export class ReportCraV1P1Module {

  }