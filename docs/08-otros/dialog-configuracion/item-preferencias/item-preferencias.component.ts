import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslationService } from '../../../../../../../core/services/translation.service';
import { PrimeNgModule } from '../../../../../../../prime-ng/prime-ng.module';
import { PreferencesService, VistaType } from '../../../../services/configuracion/preferences.service';
import { ConfiguracionService } from '../../../../services/configuracion/configuracion.service';
import { MessageService } from '../../../../../../../core/services/message.service';
import { PreferenciasPayload } from '../../../../interfaces/configuracion/PreferenciasResponse';

@Component({
  selector: 'app-item-preferencias',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PrimeNgModule],
  templateUrl: './item-preferencias.component.html',
  styleUrls: ['./item-preferencias.component.css']
})
export class ItemPreferenciasComponent implements OnInit {
  preferenciasForm: FormGroup = new FormGroup({
    mostrar_favoritos: new FormControl(true),
    mostrar_recientes: new FormControl(true),
    mostrar_frecuentes: new FormControl(true),
    items_recientes: new FormControl(5, [Validators.required]),
    items_frecuentes: new FormControl(5, [Validators.required]),
    vista_layout: new FormControl('GRID', [Validators.required])
  });
  guardando: boolean = false;

  // Opciones para selects (labels se traducen en buildVistaLayoutOpciones)
  vistaLayoutOpciones: { label: string; value: string }[] = [];

  itemsRecientesOpciones = [
    { label: 'No mostrar', value: 0 },
    { label: '3', value: 3 },
    { label: '5', value: 5 },
    { label: '10', value: 10 }
  ];

  itemsFrecuentesOpciones = [
    { label: 'No mostrar', value: 0 },
    { label: '1', value: 1 },
    { label: '2', value: 2 },
    { label: '3', value: 3 },
    { label: '4', value: 4 }
  ];

  constructor(
    private translationService: TranslationService,
    private preferencesService: PreferencesService,
    private configuracionService: ConfiguracionService,
    private messageService: MessageService
  ) { }

  t(key: string, fallback: string = key): string {
    return this.translationService.t(key, fallback);
  }

  ngOnInit(): void {
    this.buildVistaLayoutOpciones();

    // Inicializar el formulario con los valores actuales del servicio
    this.preferenciasForm.patchValue({
      vista_layout: this.preferencesService.getVista(),
      items_recientes: this.preferencesService.getItemsRecientes(),
      items_frecuentes: this.preferencesService.getItemsFrecuentes(),
      mostrar_favoritos: this.preferencesService.getMostrarFavoritos(),
      mostrar_recientes: this.preferencesService.getMostrarRecientes(),
      mostrar_frecuentes: this.preferencesService.getMostrarFrecuentes()
    }, { emitEvent: false });

    // Inicializar control desde el servicio compartido
    this.preferencesService.vista$.subscribe((v: VistaType) => {
      const current = this.preferenciasForm.get('vista_layout')?.value;
      if (current !== v) {
        this.preferenciasForm.get('vista_layout')?.setValue(v);
      }
    });
    this.preferencesService.itemsRecientes$.subscribe((n: number) => {
      const current = Number(this.preferenciasForm.get('items_recientes')?.value) || 0;
      // No sincronizar si el valor actual es 0 (No mostrar) - mantener el 0 en el formulario
      if (current !== Number(n) && current !== 0) {
        this.preferenciasForm.get('items_recientes')?.setValue(n);
      }
    });
    this.preferencesService.itemsFrecuentes$.subscribe((n: number) => {
      const current = Number(this.preferenciasForm.get('items_frecuentes')?.value) || 0;
      // No sincronizar si el valor actual es 0 (No mostrar) - mantener el 0 en el formulario
      if (current !== Number(n) && current !== 0) {
        this.preferenciasForm.get('items_frecuentes')?.setValue(n);
      }
    });
    this.preferencesService.mostrarFavoritos$.subscribe((show: boolean) => {
      const current = this.preferenciasForm.get('mostrar_favoritos')?.value;
      if (current !== show) {
        this.preferenciasForm.get('mostrar_favoritos')?.setValue(show);
      }
    });
    this.preferencesService.mostrarRecientes$.subscribe((show: boolean) => {
      const itemsRec = Number(this.preferenciasForm.get('items_recientes')?.value) || 0;
      // No hacer nada - dejar que el usuario controle el valor manualmente
      // El bindings del formulario con el select que son suficientes
    });
    this.preferencesService.mostrarFrecuentes$.subscribe((show: boolean) => {
      const itemsFreq = Number(this.preferenciasForm.get('items_frecuentes')?.value) || 0;
      // No hacer nada - dejar que el usuario controle el valor manualmente
      // El bindings del formulario con el select que son suficientes
    });
  }

  private buildVistaLayoutOpciones(): void {
    const base = 'content.layout.dialogConfiguration.item.itemPreferencias.options.vistaLayout';
    this.vistaLayoutOpciones = [
      { label: this.t(`${base}.0.label`, 'Cuadrícula'), value: 'GRID' },
      { label: this.t(`${base}.1.label`, 'Lista'), value: 'LIST' }
    ];
  }

  guardarPreferencias(): void {
    if (this.preferenciasForm.valid && !this.guardando) {
      this.guardando = true;
      this.preferenciasForm.disable();

      // Publicar cambio de vista localmente (UX instantánea + persist local)
      const vista = this.preferenciasForm.get('vista_layout')?.value as VistaType;
      if (vista) {
        this.preferencesService.setVista(vista);
      }
      // Actualizar items recientes localmente - permitir 0 como "No mostrar"
      const itemsRecValue = this.preferenciasForm.get('items_recientes')?.value;
      const itemsRec = Number.isFinite(Number(itemsRecValue)) ? Number(itemsRecValue) : 5;
      this.preferencesService.setItemsRecientes(itemsRec);
      // Determinar si mostrar recientes: true si itemsRec > 0, false si itemsRec === 0
      const mostrarRec = itemsRec > 0;
      this.preferencesService.setMostrarRecientes(mostrarRec);
      // Actualizar items frecuentes localmente - permitir 0 como "No mostrar"
      const itemsFreqValue = this.preferenciasForm.get('items_frecuentes')?.value;
      const itemsFreq = Number.isFinite(Number(itemsFreqValue)) ? Number(itemsFreqValue) : 5;
      this.preferencesService.setItemsFrecuentes(itemsFreq);
      // Determinar si mostrar frecuentes: true si itemsFreq > 0, false si itemsFreq === 0
      const mostrarFreq = itemsFreq > 0;
      this.preferencesService.setMostrarFrecuentes(mostrarFreq);
      // Actualizar mostrar favoritos localmente
      const mostrarFav = !!this.preferenciasForm.get('mostrar_favoritos')?.value;
      this.preferencesService.setMostrarFavoritos(mostrarFav);

      // Preparar payload para backend
      // Si items_recientes === 0, enviar 5 (el backend no acepta 0, pero localmente usamos 0 para indicar "no mostrar")
      const itemsRecientesParaBackend = itemsRec > 0 ? itemsRec : 5;
      // Si items_frecuentes === 0, enviar 1 (el backend no acepta 0, pero localmente usamos 0 para indicar "no mostrar")
      const itemsFrecuentesParaBackend = itemsFreq > 0 ? itemsFreq : 1;
      const payload: PreferenciasPayload = {
        mostrar_favoritos: !!this.preferenciasForm.get('mostrar_favoritos')?.value,
        mostrar_recientes: !!this.preferenciasForm.get('mostrar_recientes')?.value,
        mostrar_frecuentes: !!this.preferenciasForm.get('mostrar_frecuentes')?.value,
        items_recientes: itemsRecientesParaBackend,
        items_frecuentes: itemsFrecuentesParaBackend,
        vista_layout: this.preferenciasForm.get('vista_layout')?.value || 'GRID'
      };

      // Llamar al endpoint para persistir en backend
      this.configuracionService.guardarPreferencias(payload).subscribe({
        next: (resp) => {
          this.messageService.handleBackendResponse(resp, true);
          this.preferencesService.clearPending();
          this.guardando = false;
          this.preferenciasForm.enable();
        },
        error: (err) => {
          // Marcar pending y notificar
          this.preferencesService.markPending(payload);
          console.error(err);
          this.guardando = false;
          this.preferenciasForm.enable();
        }
      });
    }
  }

  resetearPreferencias(): void {
    if (!this.guardando) {
      this.guardando = true;
      this.preferenciasForm.disable();

      // Resetear a valores por defecto
      this.preferenciasForm.patchValue({
        mostrar_favoritos: true,
        mostrar_recientes: true,
        mostrar_frecuentes: true,
        items_recientes: 5,
        items_frecuentes: 5,
        vista_layout: 'GRID'
      });

      // Asegurar sincronización cuando se reestablecen preferencias
      this.preferencesService.setVista('GRID');
      this.preferencesService.setItemsRecientes(5);
      this.preferencesService.setMostrarRecientes(true);
      this.preferencesService.setItemsFrecuentes(5);
      this.preferencesService.setMostrarFrecuentes(true);
      this.preferencesService.setMostrarFavoritos(true);

      // Intentar reset en backend (siempre con valores válidos)
      this.configuracionService.resetearPreferencias().subscribe({
        next: (resp) => {
          this.messageService.handleBackendResponse(resp, true);
          this.preferencesService.clearPending();
          this.guardando = false;
          this.preferenciasForm.enable();
        },
        error: (err) => {
          // marcar pending genérico
          this.preferencesService.markPending({ reset: true });
          console.error(err);
          this.guardando = false;
          this.preferenciasForm.enable();
        }
      });
    }
  }
}
