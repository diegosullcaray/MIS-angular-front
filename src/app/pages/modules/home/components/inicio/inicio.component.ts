import { Component, computed, inject } from '@angular/core';
import {provideIcons } from '@ng-icons/core';
import { lucideTrophy } from '@ng-icons/lucide';
import { ShellStateService } from '../../../../../core/services/shell-state.service';


@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [],
  viewProviders: [provideIcons({ lucideTrophy })],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css',
})
export class InicioComponent {
  protected readonly shell = inject(ShellStateService);

  constructor() {
  }

  protected readonly primerNombre = computed(() => {
    const nombre = this.shell.usuarioActivo()?.nombre ?? '';
    return nombre.split(' ')[0];
  });
}
