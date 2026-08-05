import { Component, EventEmitter, Output, input, signal, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import type { DestinoCreditoItem } from '../../../models/actividades.model';

@Component({
  selector: 'app-destino-credito-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    DatePickerModule,
    CheckboxModule,
  ],
  templateUrl: './destino-credito-dialog.component.html',
  styleUrl: './destino-credito-dialog.component.css',
})
export class DestinoCreditoDialogComponent implements OnChanges {
  /** Item a editar */
  readonly itemData = input<DestinoCreditoItem | null>(null);
  readonly visible = input<boolean>(false);

  @Output() readonly visibleChange = new EventEmitter<boolean>();
  @Output() readonly onGuardar = new EventEmitter<{ cod_ope: string; fec_vis: string; is_valid: string }>();

  /** Fecha máxima para DatePicker */
  protected readonly today = new Date();
  protected codAsesor = '';
  protected asesor = '';
  protected desCli = '';
  protected ctaCli = '';
  protected codOpe = '';
  protected fecDes = '';
  protected monDes = 0;
  protected fecVis: Date | null = null;
  protected cumpleDestino = false;

  protected fecVisError = false;

  ngOnChanges(): void {
    const item = this.itemData();
    if (item) {
      this.codAsesor = item.HCODSEC || '';
      this.asesor = item.HDESSEC || '';
      this.desCli = item.HDESCLI || '';
      this.ctaCli = item.HCTACLI || '';
      this.codOpe = item.HCODOPE || '';
      this.fecDes = item.HFECDES || '';
      this.monDes = item.HMONDES || 0;
      this.fecVis = item.HFECVIS ? new Date(item.HFECVIS) : null;
      this.cumpleDestino = item.HCUMPLDC === 'Si';
      this.fecVisError = false;
    }
  }

  protected cerrar(): void {
    this.visibleChange.emit(false);
  }

  protected guardar(): void {
    if (!this.fecVis) {
      this.fecVisError = true;
      return;
    }
    this.fecVisError = false;

    const dateStr = this.fecVis.toISOString().split('T')[0];
    this.onGuardar.emit({
      cod_ope: this.codOpe,
      fec_vis: dateStr,
      is_valid: this.cumpleDestino ? 'Si' : 'No',
    });
    this.cerrar();
  }
}
