import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

const DURACION_MS = 4500;

/** Fachada de notificaciones del Host sobre el Toast de PrimeNG. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly messages = inject(MessageService);

  exito(titulo: string, detalle?: string): void {
    this.publicar('success', titulo, detalle);
  }

  error(titulo: string, detalle?: string): void {
    this.publicar('error', titulo, detalle);
  }

  info(titulo: string, detalle?: string): void {
    this.publicar('info', titulo, detalle);
  }

  advertencia(titulo: string, detalle?: string): void {
    this.publicar('warn', titulo, detalle);
  }

  private publicar(severity: string, summary: string, detail?: string): void {
    this.messages.add({ severity, summary, detail, life: DURACION_MS });
  }
}
