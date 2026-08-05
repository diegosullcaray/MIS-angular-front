import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BasenegativaComponent } from './basenegativa.component';

const routes: Routes = [
  {
    path: '', // Se deja vacío porque el prefijo ya viene del app-routing
    component: BasenegativaComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BasenegativaRoutingModule { }