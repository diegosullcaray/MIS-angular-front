import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { ActividadesService } from '../../services/actividades.service';
import type { NuevoProspecto, ProspectoCorresponsalItem } from '../../models/actividades.model';
import { ListSkeletonComponent } from '../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { InlineErrorComponent } from '../../../../../shared/ui/inline-error/inline-error.component';
import { WindowPanelComponent } from '../../../../../shared/ui/window-panel/window-panel.component';
import { inputValue } from '../../../../../shared/utils/dom.util';

@Component({
  selector: 'app-prospectos-corresponsal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TagModule,
    TooltipModule,
    DialogModule,
    SelectModule,
    ListSkeletonComponent,
    InlineErrorComponent,
    WindowPanelComponent,
  ],
  templateUrl: './prospectos-corresponsal.component.html',
  styleUrl: './prospectos-corresponsal.component.css',
})
export class ProspectosCorresponsalComponent implements OnInit {
  private readonly service = inject(ActividadesService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly data = signal<ProspectoCorresponsalItem[]>([]);
  readonly globalFilter = signal('');
  readonly modalVisible = signal(false);
  readonly guardando = signal(false);
  protected formErrors: Record<string, string> = {};

  protected nuevo: NuevoProspecto = this.nuevoVacio();

  readonly opcionesSiNo = [
    { label: 'SI', value: 'SI' },
    { label: 'NO', value: 'NO' },
  ];
  readonly opcionesTipoAgente = [
    { label: 'Agente Confianza', value: 'Agente Confianza' },
    { label: 'Agente Satelital', value: 'Agente Satelital' },
    { label: 'Tambillo', value: 'Tambillo' },
  ];
  readonly opcionesCanalCaptacion = [
    { label: 'Financiera Confianza', value: 'Financiera Confianza' },
    { label: 'Woccu', value: 'Woccu' },
    { label: 'Alianza Cacao', value: 'Alianza Cacao' },
  ];
  readonly opcionesZona = [
    { label: 'URBANA', value: 'URBANA' },
    { label: 'RURAL', value: 'RURAL' },
  ];
  readonly opcionesProspecto = [
    { label: 'APLICA', value: 'APLICA' },
    { label: 'NO APLICA', value: 'NO APLICA' },
  ];
  readonly opcionesTipoVinculo = [
    { label: 'NINGUNO', value: 'NINGUNO' },
    { label: 'PADRE', value: 'PADRE' },
    { label: 'MADRE', value: 'MADRE' },
    { label: 'HERMANO', value: 'HERMANO' },
    { label: 'HERMANA', value: 'HERMANA' },
    { label: 'VIVIENTE', value: 'VIVIENTE' },
    { label: 'CONYUGE', value: 'CONYUGE' },
  ];

  readonly filteredData = computed(() => {
    const q = this.globalFilter().toLowerCase().trim();
    if (!q) return this.data();
    return this.data().filter(
      (x) =>
        x.HAPENOMB?.toLowerCase().includes(q) ||
        x.HNUMDOC?.toLowerCase().includes(q) ||
        x.HNUMRUC?.toLowerCase().includes(q)
    );
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  protected cargarDatos(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.getRegResultadosListProsp().subscribe({
      next: (res) => {
        const body = res.body as { resultado?: { result?: ProspectoCorresponsalItem[] } } | null;
        this.data.set(body?.resultado?.result ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set('No se pudo cargar la información de Prospectos de Corresponsal.');
        this.loading.set(false);
      },
    });
  }

  protected onSearchInput(event: Event): void {
    this.globalFilter.set(inputValue(event));
  }

  protected abrirNuevoRegistro(): void {
    this.nuevo = this.nuevoVacio();
    this.formErrors = {};
    this.modalVisible.set(true);
  }

  protected guardarRegistro(): void {
    if (!this.validar()) return;
    this.guardando.set(true);

    this.service.postRegResultadosProsp(this.nuevo).subscribe({
      next: () => {
        this.guardando.set(false);
        this.modalVisible.set(false);
        this.cargarDatos();
      },
      error: (err) => {
        console.error(err);
        this.guardando.set(false);
      },
    });
  }

  private nuevoVacio(): NuevoProspecto {
    return {
      HAPENOMB: '', HNUMDOC: '', HNUMRUC: '', HCELULAR: '',
      HDIREC: '', HNOMCOM: '', HTIPAGENT: '', HCANACAP: '',
      HZONA: '', HPROSPEC: '', HVINFAMI: 'NO', HTIPVINC: 'NINGUNO',
      HGEOLATI: '', HGEOLON: '', HCTALICEF: 'NO', HAPERTCTA: 'NO', HINSTALAD: 'NO',
    };
  }

  private validar(): boolean {
    const e: Record<string, string> = {};
    if (!this.nuevo.HAPENOMB.trim()) e['HAPENOMB'] = 'Apellidos y Nombres es requerido';
    if (!this.nuevo.HNUMDOC.trim()) e['HNUMDOC'] = 'DNI es requerido';
    if (!this.nuevo.HCELULAR.trim()) e['HCELULAR'] = 'Celular es requerido';
    if (!this.nuevo.HDIREC.trim()) e['HDIREC'] = 'Dirección es requerida';
    this.formErrors = e;
    return Object.keys(e).length === 0;
  }
}
