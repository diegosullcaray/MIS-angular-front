import { Component, effect, input, signal, untracked } from '@angular/core';
import { loadRemoteModule } from '@angular-architects/native-federation';
import { RemoteSkeletonComponent } from '../../../shared/ui/remote-skeleton/remote-skeleton.component';
import { RemoteErrorComponent } from '../../../shared/ui/remote-error/remote-error.component';
import { NgComponentOutlet } from '@angular/common';

type LoadState = 'loading' | 'loaded' | 'error';

/**
 * RemoteWrapperComponent — orquesta la carga dinámica de Remotes.
 *
 * Implementa los 3 estados del ciclo de vida de un Remote:
 * 1. loading  → muestra RemoteSkeletonComponent
 * 2. loaded   → inyecta el componente remoto vía NgComponentOutlet
 * 3. error    → muestra RemoteErrorComponent con botón de reintento
 *
 * Cumple criterios de aceptación CA-01, CA-02, CA-04, CA-05.
 * Regla RN-04: usa loadRemoteModule (NO iframes).
 */
@Component({
  selector: 'app-remote-wrapper',
  standalone: true,
  imports: [NgComponentOutlet, RemoteSkeletonComponent, RemoteErrorComponent],
  template: `
    @switch (estado()) {
      @case ('loading') {
        <app-remote-skeleton />
      }

      @case ('error') {
        <app-remote-error
          [subsistema]="remoteName()"
          [motivo]="errorMsg()"
          (reintentar)="cargarRemote()"
        />
      }

      @case ('loaded') {
        @if (remoteComponent()) {
          <ng-component-outlet [ngComponentOutlet]="remoteComponent()!" />
        }
      }
    }
  `,
})
export class RemoteWrapperComponent {
  /** Slug del remote (del path param :remoteName en app.routes.ts) */
  readonly remoteName = input.required<string>();

  protected readonly estado         = signal<LoadState>('loading');
  protected readonly remoteComponent = signal<any>(null);
  protected readonly errorMsg        = signal<string | undefined>(undefined);

  constructor() {
    // Recarga al cambiar de remote: el Router reutiliza esta instancia al
    // navegar /admin/a → /admin/b (mismo route config), así que un ngOnInit
    // solo cargaría el primero. El effect reacciona a cada cambio del slug.
    effect(() => {
      this.remoteName();
      untracked(() => this.cargarRemote());
    });
  }

  protected async cargarRemote(): Promise<void> {
    const remote = this.remoteName();
    this.estado.set('loading');
    this.errorMsg.set(undefined);
    this.remoteComponent.set(null);

    try {
      // Intenta cargar el módulo remoto del manifest
      const m = await loadRemoteModule({
        remoteName:     remote,
        exposedModule:  './Component',
      });

      // Si el usuario ya navegó a otro remote, descarta esta respuesta tardía
      if (remote !== this.remoteName()) return;

      // El Remote debe exportar un componente por defecto o 'AppComponent'
      const comp = m?.default ?? m?.AppComponent ?? m?.RemoteRootComponent;

      if (!comp) {
        throw new Error(`El remote '${this.remoteName()}' no expone un componente válido.`);
      }

      this.remoteComponent.set(comp);
      this.estado.set('loaded');

    } catch (err: unknown) {
      if (remote !== this.remoteName()) return;

      const message = err instanceof Error ? err.message : 'Error de red desconocido.';
      this.errorMsg.set(message);
      this.estado.set('error');
      console.warn(`[RemoteWrapper] Error cargando '${remote}':`, err);
    }
  }
}
