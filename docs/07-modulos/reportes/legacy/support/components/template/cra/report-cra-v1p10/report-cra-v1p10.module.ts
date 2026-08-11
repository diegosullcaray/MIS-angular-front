import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportCraV1p10Component } from './report-cra-v1p10.component';
import { SelectModule } from '../../../select/select.module';
import { TableModule } from '../../../table/table.module';
import { GraphicModule } from '../../../graphic/graphic.module';
import { MatTabsModule } from '@angular/material/tabs';
import { SharedModule } from 'app/shared/shared.module';

const components = [
    ReportCraV1p10Component
  ]

@NgModule({
    imports: [
      CommonModule,
      SelectModule,
      TableModule,
      GraphicModule,
      MatTabsModule,
      SharedModule,
    ],
    declarations: components,
    exports:components

  })
  export class ReportCraV1P10Module {

  }