import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardService } from './dashboard.service';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import type { FuenteBusqueda, RegistroBuscable } from '../../../../shared/buscador/buscador.model';

/** Dónde vive la pantalla que renderiza un reporte de Power BI (ver `dashboard.routes.ts`). */
const RUTA_POWER_BI = '/app/dashboards/power-bi';

/**
 * Aporta al buscador los reportes de "Dashboards Integrados".
 *
 * Son data del módulo, no del árbol de menús: la navegación solo tiene el
 * sistema entero como una hoja (`/app/dashboards`), así que sin esta fuente un
 * dashboard puntual sería inencontrable salvo entrando al módulo y mirando la
 * lista a ojo.
 *
 * Los permisos ya vienen resueltos: `DashboardService.cargarReportes()` le pide
 * la lista al backend con el `codBt` del usuario y su flag de admin, y solo
 * guarda lo que ese usuario puede abrir. Mientras el módulo no se haya visitado
 * la lista está vacía y esta fuente simplemente no aporta nada.
 */
@Injectable({ providedIn: 'root' })
export class FuenteDashboardsService implements FuenteBusqueda {
  readonly id = 'dashboards';

  private readonly dashboard = inject(DashboardService);
  private readonly shell = inject(ShellStateService);
  private readonly router = inject(Router);

  registros(): RegistroBuscable[] {
    return this.dashboard.reportes().map((reporte) => ({
      id: `dashboards/${reporte.id}`,
      etiqueta: reporte.name,
      ubicacion: 'Dashboards Integrados',
      origen: 'Dashboards Integrados',
      tipo: 'Dashboard',
      abrir: () => {
        // Mismo par de pasos que hace la lista del módulo: primero se fija cuál
        // es el reporte activo y después se entra a la pantalla que lo dibuja.
        this.dashboard.seleccionarReporte(reporte);
        this.shell.setContenidoPendienteSeleccion(false);
        this.router.navigateByUrl(RUTA_POWER_BI).catch((err) => console.warn(`No se pudo abrir el dashboard`, err));
      },
    }));
  }
}
