import { Injectable, signal } from '@angular/core';

export type ToastSeverity = 'success' | 'error' | 'info' | 'warn';

export interface ToastMessage {
  id: number;
  severity: ToastSeverity;
  titulo: string;
  detalle?: string;
}

const DURACION_MS = 4500;

/**
 * Fachada de notificaciones del Host. El stack de toasts vive en `mensajes`
 * (signal) y se renderiza una sola vez con `<app-toast />` en el root
 * (`app.ts`) — ver `shared/ui/toast/toast.component.ts`.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly mensajes = signal<ToastMessage[]>([]);
  readonly toasts = this.mensajes.asReadonly();

  private siguienteId = 0;

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

  descartar(id: number): void {
    this.mensajes.update((actual) => actual.filter((m) => m.id !== id));
  }

  private publicar(severity: ToastSeverity, titulo: string, detalle?: string): void {
    const id = ++this.siguienteId;
    this.mensajes.update((actual) => [...actual, { id, severity, titulo, detalle }]);
    setTimeout(() => this.descartar(id), DURACION_MS);
  }
}
