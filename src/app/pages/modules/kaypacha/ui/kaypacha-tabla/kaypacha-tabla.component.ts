import { Component, input } from '@angular/core';
import { NgStyle } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TableHeaderDef } from '../../models/kaypacha-table-header.model';

@Component({
  selector: 'app-kaypacha-tabla',
  standalone: true,
  imports: [TableModule, NgStyle],
  templateUrl: './kaypacha-tabla.component.html',
})
export class KaypachaTablaComponent {
  dataSource = input.required<unknown[]>();
  headers = input.required<TableHeaderDef[]>();
  mensajeVacio = input('Sin datos registrados en esta sección');
  scrollable = input(false);
  scrollHeight = input<string | undefined>(undefined);
}
