import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { PrimeNgModule } from '../../../../../../../prime-ng/prime-ng.module';
import { ConfiguracionService } from '../../../../services/configuracion/configuracion.service';
import { MessageService } from '../../../../../../../core/services/message.service';
import { TranslationService } from '../../../../../../../core/services/translation.service';
import { TimeFormatService } from '../../../../../../../core/services/time-format.service';
import { combineLatest, map, Observable, timeout } from 'rxjs';
import { SesionesResponse, Device } from '../../../../interfaces/home/SesionesResponse';

@Component({
  selector: 'app-item-sesiones',
  standalone: true,
  imports: [CommonModule, PrimeNgModule],
  templateUrl: './item-sesiones.component.html',
  styleUrl: './item-sesiones.component.css'
})
export class ItemSesionesComponent implements OnInit {
  data: Device[] = [];
  loading = false;
  error: string | null = null;
  revocandoId: string | null = null;
  revocandoOtras = false;

  constructor(
    private configuracionService: ConfiguracionService,
    private messageService: MessageService,
    private translationService: TranslationService,
    private timeFormatService: TimeFormatService,
    private cdr: ChangeDetectorRef
  ) {
    this.sessionFormat$ = combineLatest([
      this.timeFormatService.dateFormat$,
      this.timeFormatService.timeFormat$
    ]).pipe(
      map(([d, t]) => `${d ?? 'd/M/yyyy'}, ${t ?? 'HH:mm'}`)
    );
  }

  readonly sessionFormat$!: Observable<string>;

  t(key: string, fallback: string = key): string {
    return this.translationService.t(key, fallback);
  }

  tFormat(key: string, fallback: string, params?: Record<string, string | number>): string {
    return this.translationService.tFormat(key, fallback, params);
  }

  ngOnInit(): void {
    this.cargarSesiones();
  }

  cargarSesiones(): void {
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();

    this.configuracionService.getSesiones()
      .pipe(
        // Timeout de seguridad: si tarda más de 15s, fuerza error para no quedar bloqueado
        timeout({ each: 15000, with: () => {
          throw new Error(this.t('content.layout.dialogConfiguration.item.itemSesiones.errorTimeout', 'La solicitud tardó demasiado. Intenta de nuevo.'));
        }})
      )
      .subscribe({
        next: (res: SesionesResponse) => {
          this.loading = false;
          if (res.success && res.data?.devices) {
            this.data = res.data.devices;
          } else {
            this.data = [];
            this.error = res.message || this.t('content.layout.dialogConfiguration.item.itemSesiones.errorLoad', 'No se pudieron cargar las sesiones.');
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.loading = false;
          this.data = [];
          this.error = err?.error?.message || err?.message || this.t('content.layout.dialogConfiguration.item.itemSesiones.errorLoad', 'Error al cargar las sesiones activas.');
          this.cdr.detectChanges();
        }
      });
  }

  /** Icono según tipo de dispositivo (Web, Desktop App, etc.) */
  getDeviceIcon(deviceType: string): string {
    const t = (deviceType || '').toLowerCase();
    if (t.includes('desktop') || t.includes('app')) return 'pi pi-desktop';
    if (t.includes('mobile') || t.includes('phone')) return 'pi pi-mobile';
    return 'pi pi-tablet'; // Web por defecto
  }

  /** Icono según navegador (Postman, Chrome, Firefox, etc.) */
  getBrowserIcon(browser: string): string {
    const b = (browser || '').toLowerCase();
    if (b.includes('postman')) return 'pi pi-send';
    if (b.includes('chrome')) return 'pi pi-globe';
    if (b.includes('firefox')) return 'pi pi-globe';
    if (b.includes('edge') || b.includes('safari')) return 'pi pi-globe';
    return 'pi pi-globe'; // genérico
  }

  /** Fecha/hora de creación de la sesión del dispositivo */
  getCreatedAt(device: Device): Date | null {
    const createdAt = device.session?.createdAt;
    return createdAt ? new Date(createdAt) : null;
  }

  /** Formatea la fecha de creación usando el locale actual y los formatos seleccionados. */
  formatSessionDate(device: Device): string {
    const d = this.getCreatedAt(device);
    if (!d) return this.t('content.layout.dialogConfiguration.item.itemSesiones.createdUnknown', '—');

    const dateFmt = this.timeFormatService.getDateFormat() ?? 'd/M/yyyy';
    const timeFmt = this.timeFormatService.getTimeFormat() ?? 'HH:mm';
    const locale = this.translationService.currentLocale || 'es';

    // Caso especial para patrón con nombres de mes largos y literales "de":
    if (dateFmt.includes("'de'") && dateFmt.includes('MMMM')) {
      const monthName = new Intl.DateTimeFormat(locale, { month: 'long' }).format(d);
      const day = d.getDate();
      const year = d.getFullYear();
      const hour12 = /(^|[^H])h(?![a-zA-Z])/.test(timeFmt) && !/HH/.test(timeFmt);
      const time = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12 }).format(d);

      // Construir la cadena respetando convenciones por idioma
      const lang = (locale || 'es').toLowerCase();
      if (lang.startsWith('en')) {
        // Inglés: "September 1, 2026, 02:30 PM" (month day, year)
        return `${monthName} ${day}, ${year}, ${time}`;
      }
      // Español/Portugués y otros: "1 de septiembre de 2026, 14:30"
      return `${day} de ${monthName} de ${year}, ${time}`;
    }

    // Fallback: construir opciones para Intl.DateTimeFormat basadas en tokens simples
    const dateOptions: Intl.DateTimeFormatOptions = {};
    if (dateFmt.includes('yyyy')) dateOptions.year = 'numeric';
    if (dateFmt.includes('MMMM')) dateOptions.month = 'long';
    else if (dateFmt.includes('MMM')) dateOptions.month = 'short';
    else if (dateFmt.includes('MM')) dateOptions.month = '2-digit';
    else if (dateFmt.includes('M')) dateOptions.month = 'numeric';
    if (dateFmt.includes('dd')) dateOptions.day = '2-digit';
    else if (dateFmt.includes('d')) dateOptions.day = 'numeric';

    const timeOptions: Intl.DateTimeFormatOptions = {};
    if (timeFmt.includes('HH') || timeFmt.includes('hh') || timeFmt.includes('h')) {
      timeOptions.hour = '2-digit';
      timeOptions.minute = '2-digit';
      if (timeFmt.includes('ss')) timeOptions.second = '2-digit';
      timeOptions.hour12 = /(^|[^H])h(?![a-zA-Z])/.test(timeFmt) && !/HH/.test(timeFmt);
    }

    const combined: Intl.DateTimeFormatOptions = { ...dateOptions, ...timeOptions };
    try {
      return new Intl.DateTimeFormat(locale, combined).format(d);
    } catch (e) {
      // última defensa: ISO corta
      return d.toLocaleString();
    }
  }

  getDisplayName(device: Device): string {
    return device.deviceType || device.browser || this.t('content.layout.dialogConfiguration.item.itemSesiones.unknownDevice', 'Dispositivo');
  }

  revocarSesion(device: Device): void {
    const sessionId = device.session?.id;
    if (!sessionId) return;
    this.revocandoId = device.deviceFingerprint || '';
    this.configuracionService.revocarSesion(sessionId).subscribe({
      next: (resp) => {
        this.messageService.handleBackendResponse(resp, true);
        this.revocandoId = null;
        this.cargarSesiones();
      },
      error: (err) => {
        console.error(err);
        this.revocandoId = null;
        this.cargarSesiones();
      }
    });
  }

  isRevocando(device: Device): boolean {
    return this.revocandoId === (device.deviceFingerprint || '');
  }

  /** Revoca todas las sesiones excepto la actual (DELETE /api/auth/sessions/others). */
  revocarOtrasSesiones(): void {
    this.revocandoOtras = true;
    this.configuracionService.revocarOtrasSesiones().subscribe({
      next: (resp) => {
        this.messageService.handleBackendResponse(resp, true);
        this.revocandoOtras = false;
        this.cargarSesiones();
      },
      error: (err) => {
        console.error(err);
        this.revocandoOtras = false;
        this.cargarSesiones();
      }
    });
  }
}
