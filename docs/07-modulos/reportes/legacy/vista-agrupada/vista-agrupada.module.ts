import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'app/material/material.module';
import { VistaAgrupadaRoutingModule } from './vista-agrupada-routing.module';
import { DummyComponent } from './dummy/dummy.component';


@NgModule({
  declarations: [DummyComponent],
  imports: [
    CommonModule,
    VistaAgrupadaRoutingModule,
    MaterialModule
  ]
})
export class VistaAgrupadaModule { }
