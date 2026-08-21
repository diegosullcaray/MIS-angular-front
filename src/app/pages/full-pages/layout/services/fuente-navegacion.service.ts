import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NavegacionSistemasService } from './navegacion-sistemas.service';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import type { FuenteBusqueda, RegistroBuscable } from '../../../../shared/ui/buscador/buscador.model';

/** Aporta al buscador el árbol de navegación completo: todos los sistemas, a cualquier profundidad. */
@Injectable({ providedIn: 'root' })
export class FuenteNavegacionService implements FuenteBusqueda {
  readonly id = 'navegacion';

  private readonly navegacion = inject(NavegacionSistemasService);
  private readonly shell = inject(ShellStateService);
  private readonly router = inject(Router);

  registros(): RegistroBuscable[] {
    return this.navegacion.registros().map((registro) => ({
      id: registro.id,
      etiqueta: registro.etiqueta,
      ubicacion: registro.ubicacion,
      // El "módulo" de un nodo de navegación es el sistema que lo contiene.
      origen: registro.sistema,
      tipo: registro.tipo,
      abrir: () => this.abrir(registro),
    }));
  }

  /** Una hoja navega a su pantalla; una carpeta se abre en el explorador. */
  private abrir(registro: ReturnType<NavegacionSistemasService['registros']>[number]): void {
    if (registro.tipo === 'Carpeta') {
      this.navegacion.abrirEnCarpeta(registro.sistemaId, [...registro.carpetas, registro.nodo]);
      return;
    }

    if (!registro.ruta) return;

    this.shell.setSidebarIconActivo(registro.sistemaId);
    this.shell.setMenuItemActivo({ ruta: registro.ruta, etiqueta: registro.etiqueta });
    this.shell.setContenidoPendienteSeleccion(false);
    this.router.navigateByUrl(registro.ruta).catch(() => {});
  }
}
