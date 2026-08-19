import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MfaService } from '../../../../services/configuracion/mfa.service';
import { ConfirmarMfaPayload } from '../../../../interfaces/configuracion/ConfirmarMfaResponse';
import { RegenerarMfaPayload } from '../../../../interfaces/configuracion/RegenerarMfaResponse';
import { MessageService } from '../../../../../../../core/services/message.service';
import { MessageService as PrimeMessageService } from 'primeng/api';
import { finalize } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ToastModule } from 'primeng/toast';
import { PrimeNgModule } from '../../../../../../../prime-ng/prime-ng.module';
import { TooltipModule } from 'primeng/tooltip';
import { LoadingSpinnerComponent } from '../../../../../../../shared/components/loading-spinner/loading-spinner.component';

/** Estados posibles del componente MFA */
type Estado = 'cargando' | 'sin-registro' | 'confirmar' | 'registrado' | 'regenerar' | 'error';

@Component({
  selector: 'app-item-mfa',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PrimeNgModule,
    TooltipModule,
    ToastModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './item-mfa.component.html',
  styleUrls: ['./item-mfa.component.css'],
  providers: [MessageService, PrimeMessageService]
})
export class ItemMfaComponent implements OnInit, OnDestroy {

  estado: Estado = 'cargando';
  loading = false;

  // QR
  qrImage: string | null = null;
  qrImageRaw: string | null = null;

  // Confirmación MFA
  codigoMfa: string = '';

  // Regeneración
  passwordActual: string = '';
  mostrarPassword: boolean = false;

  // Error general (estado error)
  errorMsg: string | null = null;

  private destroy$ = new Subject<void>();
  @ViewChild('qrImg') qrImgRef?: ElementRef<HTMLImageElement>;

  constructor(
    private mfa: MfaService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.cargarQr();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─────────────────────────────────────────────────────────────────
  // Verificar si el usuario ya tiene QR registrado (al cargar)
  // ─────────────────────────────────────────────────────────────────
  cargarQr(): void {
    this.estado = 'cargando';
    this.loading = true;
    this.errorMsg = null;
    this.qrImage = null;
    this.qrImageRaw = null;

    this.mfa.generarQr()
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: (res) => {
          if (res?.success === false) {
            this.errorMsg = res.message || 'No se pudo verificar el MFA.';
            this.estado = 'error';
            return;
          }
          const qrData = res?.data?.qr;
          if (!qrData) {
            this.estado = 'registrado';
            return;
          }
          this.setQr(qrData);
          this.estado = 'sin-registro';
        },
        error: (err) => {
          this.errorMsg = err?.error?.message || err?.message || 'Error al cargar el QR.';
          this.estado = 'error';
        }
      });
  }

  // ─────────────────────────────────────────────────────────────────
  // Registro: sin-registro → confirmar
  // ─────────────────────────────────────────────────────────────────
  avanzarAConfirmar(): void {
    this.codigoMfa = '';
    this.estado = 'confirmar';
  }

  volverAlQr(): void {
    this.codigoMfa = '';
    this.estado = 'sin-registro';
  }

  confirmarCodigo(): void {
    if (!this.codigoMfa.trim()) {
      this.messageService.warn('Ingrese el código MFA de su aplicación autenticadora.');
      return;
    }
    this.loading = true;
    const payload: ConfirmarMfaPayload = { codigo_mfa: this.codigoMfa.trim() };

    this.mfa.confirmarMfa(payload)
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: (resp) => {
          if (resp?.success) {
            this.messageService.success(resp.data?.message || resp.message || 'MFA registrado correctamente.');
            this.estado = 'registrado';
          } else {
            this.messageService.handleBackendResponse(resp);
          }
        },
        error: (err) => { this.messageService.handleHttpError(err); }
      });
  }

  // ─────────────────────────────────────────────────────────────────
  // Regeneración: registrado → regenerar → sin-registro (nuevo QR) → confirmar
  // ─────────────────────────────────────────────────────────────────
  iniciarRegeneracion(): void {
    this.passwordActual = '';
    this.mostrarPassword = false;
    this.estado = 'regenerar';
  }

  cancelarRegeneracion(): void {
    this.passwordActual = '';
    this.estado = 'registrado';
  }

  regenerarQr(): void {
    if (!this.passwordActual.trim()) {
      this.messageService.warn('Ingrese su contraseña actual para continuar.');
      return;
    }
    this.loading = true;
    const payload: RegenerarMfaPayload = { password_actual: this.passwordActual };

    this.mfa.regenerarQr(payload)
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: (resp) => {
          if (resp?.success) {
            const qrData = resp.data?.qr;
            if (qrData) {
              this.setQr(qrData);
              this.codigoMfa = '';
              this.passwordActual = '';
              this.messageService.info(resp.message || 'Nuevo QR generado. Escanéalo y confirma con el código.');
              this.estado = 'sin-registro';
            } else {
              this.messageService.warn('No se recibió el QR. Intente nuevamente.');
            }
          } else {
            this.messageService.handleBackendResponse(resp);
          }
        },
        error: (err) => { this.messageService.handleHttpError(err); }
      });
  }

  // ─────────────────────────────────────────────────────────────────
  // Utilidades
  // ─────────────────────────────────────────────────────────────────
  private setQr(qrData: string): void {
    this.qrImageRaw = qrData.startsWith('data:') ? qrData : `data:image/png;base64,${qrData}`;
    this.qrImage = this.qrImageRaw;
  }

  openFullscreen(): void {
    const el = this.qrImgRef?.nativeElement;
    if (!el) return;
    try {
      const request = (el as any).requestFullscreen
        || (el as any).webkitRequestFullscreen
        || (el as any).mozRequestFullScreen
        || (el as any).msRequestFullscreen;
      if (request) { request.call(el); }
      else if (this.qrImageRaw) { window.open(this.qrImageRaw, '_blank'); }
    } catch {
      if (this.qrImageRaw) window.open(this.qrImageRaw, '_blank');
    }
  }
}
