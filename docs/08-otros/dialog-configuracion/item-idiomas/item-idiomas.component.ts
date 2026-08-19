import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, finalize } from 'rxjs';
import { TranslationService } from '../../../../../../../core/services/translation.service';
import { MessageService } from '../../../../../../../core/services/message.service';
import { TimeFormatService } from '../../../../../../../core/services/time-format.service';
import { PrimeNgModule } from '../../../../../../../prime-ng/prime-ng.module';

interface Idioma {
  label: string;
  value: string;
}

interface FormatoFecha {
  label: string;
  value: string;
  ejemplo: string;
}

interface FormatoHora {
  label: string;
  value: string;
  ejemplo: string;
}

@Component({
  selector: 'app-item-idiomas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PrimeNgModule],
  templateUrl: './item-idiomas.component.html',
  styleUrl: './item-idiomas.component.css'
})
export class ItemIdiomasComponent implements OnInit, OnDestroy {
  idiomasForm: FormGroup = new FormGroup({
    idioma: new FormControl('es', [Validators.required]),
    formato_fecha: new FormControl('dd/MM/yyyy', [Validators.required]),
    formato_hora: new FormControl('HH:mm', [Validators.required])
  });
  guardando: boolean = false;
  private destroy$ = new Subject<void>();

  // Opciones para idiomas
  idiomasOpciones: Idioma[] = [
    { label: 'Español', value: 'es' },
    { label: 'English', value: 'en' },
    { label: 'Portugués', value: 'pt' },
  ];

  // Opciones para formatos de fecha (labels localizables)
  get formatosFechaOpciones(): FormatoFecha[] {
    return [
      { label: this.t('content.layout.dialogConfiguration.item.itemIdiomas.options.dateFormats.ddMMyyyy.label', '01/09/2026'), value: 'dd/MM/yyyy', ejemplo: this.t('content.layout.dialogConfiguration.item.itemIdiomas.options.dateFormats.ddMMyyyy.example', '01/09/2026') },
      { label: this.t('content.layout.dialogConfiguration.item.itemIdiomas.options.dateFormats.MMddyyyy.label', '09/01/2026'), value: 'MM/dd/yyyy', ejemplo: this.t('content.layout.dialogConfiguration.item.itemIdiomas.options.dateFormats.MMddyyyy.example', '09/01/2026') },
      { label: this.t('content.layout.dialogConfiguration.item.itemIdiomas.options.dateFormats.yyyyMMdd.label', '2026-09-01'), value: 'yyyy-MM-dd', ejemplo: this.t('content.layout.dialogConfiguration.item.itemIdiomas.options.dateFormats.yyyyMMdd.example', '2026-09-01') },
      { label: this.t('content.layout.dialogConfiguration.item.itemIdiomas.options.dateFormats.ddDeMMMMDeyyyy.label', '1 de septiembre de 2026'), value: "dd 'de' MMMM 'de' yyyy", ejemplo: this.t('content.layout.dialogConfiguration.item.itemIdiomas.options.dateFormats.ddDeMMMMDeyyyy.example', '1 de septiembre de 2026') },
      { label: this.t('content.layout.dialogConfiguration.item.itemIdiomas.options.dateFormats.ddMMMyyyy.label', '01-sep-2026'), value: 'dd-MMM-yyyy', ejemplo: this.t('content.layout.dialogConfiguration.item.itemIdiomas.options.dateFormats.ddMMMyyyy.example', '01-sep-2026') },
      { label: this.t('content.layout.dialogConfiguration.item.itemIdiomas.options.dateFormats.ddMMyyyyDots.label', '01.09.2026'), value: 'dd.MM.yyyy', ejemplo: this.t('content.layout.dialogConfiguration.item.itemIdiomas.options.dateFormats.ddMMyyyyDots.example', '01.09.2026') }
    ];
  }

  // Opciones para formatos de hora (labels localizables)
  get formatosHoraOpciones(): FormatoHora[] {
    return [
      { label: this.t('content.layout.dialogConfiguration.item.itemIdiomas.options.timeFormats.HHmm.label', '1:01 - 23:59 (24 horas)'), value: 'HH:mm', ejemplo: this.t('content.layout.dialogConfiguration.item.itemIdiomas.options.timeFormats.HHmm.example', '14:30') },
      { label: this.t('content.layout.dialogConfiguration.item.itemIdiomas.options.timeFormats.hhmma.label', '1:01 AM - 11:59 PM (12 horas)'), value: 'hh:mm a', ejemplo: this.t('content.layout.dialogConfiguration.item.itemIdiomas.options.timeFormats.hhmma.example', '02:30 PM') },
      { label: this.t('content.layout.dialogConfiguration.item.itemIdiomas.options.timeFormats.HHmmss.label', '13:01 - 23:59 (24 horas con segundos)'), value: 'HH:mm:ss', ejemplo: this.t('content.layout.dialogConfiguration.item.itemIdiomas.options.timeFormats.HHmmss.example', '14:30:45') },
      { label: this.t('content.layout.dialogConfiguration.item.itemIdiomas.options.timeFormats.hhmmssa.label', '1:01:00 AM - 11:59:59 PM (12 horas con segundos)'), value: 'hh:mm:ss a', ejemplo: this.t('content.layout.dialogConfiguration.item.itemIdiomas.options.timeFormats.hhmmssa.example', '02:30:45 PM') }
    ];
  }

  // Zona horaria actual
  zonaHorariaActual: string = '(UTC-05:00) Bogotá, Lima, Quito, Río Branco';

  constructor(
    private translationService: TranslationService,
    private messageService: MessageService
    , private timeFormatService: TimeFormatService
  ) { }

  t(key: string, fallback: string = key): string {
    return this.translationService.t(key, fallback);
  }

  ngOnInit(): void {
    this.translationService.init('es');
    this.syncInitialLocaleFromService();
    this.syncInitialFormatsFromService();
  }

  private syncInitialFormatsFromService(): void {
    const storedDate = this.timeFormatService.getDateFormat() ?? 'dd/MM/yyyy';
    const storedTime = this.timeFormatService.getTimeFormat() ?? 'HH:mm';
    this.idiomasForm.get('formato_fecha')?.setValue(storedDate, { emitEvent: false });
    this.idiomasForm.get('formato_hora')?.setValue(storedTime, { emitEvent: false });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private syncInitialLocaleFromService(): void {
    const current = this.translationService.currentLocale; // 'es' | 'en' | etc
    const option = this.idiomasOpciones.find(o => o.value.toLowerCase().startsWith(current));
    const value = option?.value ?? 'es';
    this.idiomasForm.get('idioma')?.setValue(value, { emitEvent: false });
  }

  onAccountTabClick(event: Event): void {
    event.preventDefault();
    // Aquí puedes agregar la lógica para navegar a la pestaña "Cuenta"
  }

  onCambiarZonaHoraria(event: Event): void {
    event.preventDefault();
    // Aquí puedes agregar la lógica para abrir un diálogo de selección de zona horaria
  }

  getFechaEjemplo(): string {
    const formato = this.idiomasForm.get('formato_fecha')?.value;
    if (!formato) return '';

    const formatoObj = this.formatosFechaOpciones.find(f => f.value === formato);
    return formatoObj ? formatoObj.ejemplo : '';
  }

  getHoraEjemplo(): string {
    const formato = this.idiomasForm.get('formato_hora')?.value;
    if (!formato) return '';

    const formatoObj = this.formatosHoraOpciones.find(f => f.value === formato);
    return formatoObj ? formatoObj.ejemplo : '';
  }

  getZonaHorariaActual(): string {
    return this.zonaHorariaActual;
  }

  guardarIdiomas(): void {
    if (this.idiomasForm.valid && !this.guardando) {
      this.guardando = true;

      // Aquí puedes agregar la lógica para guardar las configuraciones
      const formValue = this.idiomasForm.value as { idioma?: string; formato_fecha?: string; formato_hora?: string };
      const locale = formValue.idioma ?? 'es';

      // Persistir formatos de fecha/hora localmente
      try {
        this.timeFormatService.setDateFormat(formValue.formato_fecha ?? 'dd/MM/yyyy');
        this.timeFormatService.setTimeFormat(formValue.formato_hora ?? 'HH:mm');
      } catch {
        // ignore
      }

      // Aplicar idioma SOLO al guardar
      this.translationService.setLocale(locale)
        .pipe(finalize(() => {
          this.guardando = false;
        }))
        .subscribe({
          next: () => {
            this.messageService.success(
              this.t('content.layout.dialogConfiguration.item.itemIdiomas.messages.saveSuccess', 'Configuración de idioma guardada correctamente')
            );
          },
          error: () => {
            this.messageService.error(
              this.t('content.layout.dialogConfiguration.item.itemIdiomas.messages.saveError', 'Error al guardar la configuración de idioma')
            );
          }
        });

    }
  }

  resetearIdiomas(): void {
    if (!this.guardando) {
      this.guardando = true;

      // Resetear a valores por defecto
      this.idiomasForm.patchValue({
        idioma: 'es',
        formato_fecha: 'dd/MM/yyyy',
        formato_hora: 'HH:mm'
      });

      // También persistir los valores por defecto
      try {
        this.timeFormatService.setDateFormat('dd/MM/yyyy');
        this.timeFormatService.setTimeFormat('HH:mm');
      } catch {
        // ignore
      }

      // Simular reset
      setTimeout(() => {
        this.guardando = false;
        this.messageService.info(
          this.t('content.layout.dialogConfiguration.item.itemIdiomas.messages.resetSuccess', 'Valores restablecidos a los predeterminados')
        );
      }, 500);
    }
  }
}
