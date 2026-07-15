import { Component } from '@angular/core';
import RemoteRootComponent from './remote-root.component';

/**
 * Root SOLO para desarrollo aislado (`npm start` en el puerto propio).
 * Simula el área de contenido que el Host asigna al remote.
 * El Host nunca carga este componente: consume './Component' (remote-root).
 */
@Component({
  selector: 'remote-root-dev',
  standalone: true,
  imports: [RemoteRootComponent],
  template: `
    <main class="min-h-screen bg-[var(--mis-bg)] p-6">
      <remote-root />
    </main>
  `,
})
export class App {}
