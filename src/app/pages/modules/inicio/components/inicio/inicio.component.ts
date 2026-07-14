import { Component, computed, inject } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { CardModule } from 'primeng/card';
import { ListSkeletonComponent } from '../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { InlineErrorComponent } from '../../../../../shared/ui/inline-error/inline-error.component';
import { lucideActivity, lucideGrid, lucideUsers } from '@ng-icons/lucide';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { SistemasService } from '../../../sistemas/services/sistemas.service';
import { AccesosService } from '../../../accesos/services/accesos.service';

@Component({
  selector: 'app-inicio',
  imports: [CardModule , ListSkeletonComponent, InlineErrorComponent, NgIconComponent],
  standalone: true,
  viewProviders: [provideIcons({
    lucideGrid, lucideUsers, lucideActivity
  })],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css',
})
export class InicioComponent {
  protected readonly shell = inject(ShellStateService);
  protected readonly sistemasService = inject(SistemasService);
  protected readonly accesosService = inject(AccesosService);

  constructor() {
    this.sistemasService.cargarSistemas();
    if (this.shell.esAdminSistema()) {
      this.accesosService.cargarUsuarios();
      this.accesosService.cargarRoles();
    }
  }

  protected readonly primerNombre = computed(() => {
    const nombre = this.shell.usuarioActivo()?.nombre ?? '';
    return nombre.split(' ')[0];
  });

  protected etiquetaEstado(estado: string): string {
    switch (estado) {
      case 'activo': return 'ONLINE';
      case 'mantenimiento': return 'MANTENIMIENTO';
      default: return 'OFFLINE';
    }
  }



}
