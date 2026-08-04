import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideTrophy } from '@ng-icons/lucide';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { KaypachaService } from '../../../ranking-k/services/kaypacha.service';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink, NgIconComponent],
  viewProviders: [provideIcons({ lucideTrophy })],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css',
})
export class InicioComponent {
  protected readonly shell = inject(ShellStateService);
  protected readonly kaypacha = inject(KaypachaService);

  constructor() {
    this.kaypacha.cargarCategorias();
  }

  protected readonly primerNombre = computed(() => {
    const nombre = this.shell.usuarioActivo()?.nombre ?? '';
    return nombre.split(' ')[0];
  });
}
