import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../services/bloque-reporte.service';
import { ShellStateService } from '../../../../../../core/services/shell-state.service';
import type { ReporteBloqueUnico } from '../components/Captaciones/models/captaciones.model';

/** tip_cod para personas. */
const TIP_COD_PERSONA = 2;

/** Servicios para Resumen de Movilidad. */
@Injectable({ providedIn: 'root' })
export class ResumenMovilidadService {
  private readonly bloques = inject(BloqueReporteService);
  private readonly shell = inject(ShellStateService);

  /** Resumen de Movilidad Comercial. */
  comercial(nodo: NodoConsulta, pagina = 1): Observable<ReporteBloqueUnico> {
    return this.bloques.regularPaginado('RESNMOV_01', nodo, {}, pagina).pipe(map((tabla1) => ({ tabla1 })));
  }

  /** Documento del usuario activo. */
  documentoUsuario(): string | undefined {
    return this.shell.usuarioActivo()?.numDoc;
  }

  /** Resumen de Movilidad Recuperaciones. */
  recuperaciones(documento: string): Observable<ReporteBloqueUnico> {
    const params = {
      fec: this.bloques.fec(),
      secuency: JSON.stringify([{ tip_cod: TIP_COD_PERSONA, cod_rel: documento, order: 0 }]),
      tip_cod: TIP_COD_PERSONA,
      cod_rel: documento,
    };
    return this.bloques
      .regularExacto('RESNMOVR_01', { tip_cod: TIP_COD_PERSONA, cod_rel: documento }, params)
      .pipe(map((tabla1) => ({ tabla1 })));
  }
}
