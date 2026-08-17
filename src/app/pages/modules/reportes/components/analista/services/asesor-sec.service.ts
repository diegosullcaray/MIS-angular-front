import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModSeccionesService } from '../../../../../../core/winder/instances/mod-secciones.service';
import { ShellStateService } from '../../../../../../core/services/shell-state.service';
import type { AsesorSec } from '../models/asesor-sec.model';

/**
 * Buscador de asesor/sectorista — legado `app-auto-complete-sec`, usado por
 * varios reportes de `rda/sectorista` ("Encuesta Clientes", "Clientes
 * Reprogramados", y previsiblemente más a medida que se migran). Compartido
 * acá para no duplicar el mapeo `result_sectorista` en cada servicio.
 */
@Injectable({ providedIn: 'root' })
export class AsesorSecService {
  private readonly secciones = inject(ModSeccionesService);
  private readonly shell = inject(ShellStateService);

  /** Lista de asesores/sectoristas visibles para el usuario logueado. */
  obtenerAsesores(): Observable<AsesorSec[]> {
    const email = this.shell.usuarioActivo()?.email ?? '';
    return this.secciones.getSecList(email).pipe(
      map((r) => {
        const filas = (r.body as { result_sectorista?: { nombre_sec: string; num_doc: string }[] } | null)?.result_sectorista ?? [];
        return filas.map((f) => ({ nombre: f.nombre_sec, dni: f.num_doc }));
      })
    );
  }
}
