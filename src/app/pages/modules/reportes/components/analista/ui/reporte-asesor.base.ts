import type { Observable } from 'rxjs';
import { SelectorAsesorBase } from './selector-asesor.base';
import type { AsesorSec } from '../models/asesor-sec.model';
import type { TablaReporteResultado } from '../../../models/tabla-reporte.model';

/**
 * Reporte que se consulta eligiendo un asesor.
 *
 * La subclase aporta la consulta y dónde volcar el resultado; el resto —estado
 * de carga, aviso de "sin resultados", toast de error— vive acá.
 */
export abstract class ReporteAsesorBase<T> extends SelectorAsesorBase {
  /** Detalle del aviso cuando el asesor no tiene datos. */
  protected abstract readonly avisoSinResultados: string;
  /** Título del toast de error, para los reportes que lo nombran distinto. */
  protected readonly errorDeCarga: string = 'No se pudo cargar el reporte';

  protected abstract consultar(asesor: AsesorSec): Observable<T>;

  /** Vuelca el resultado en las señales y devuelve si vino vacío. */
  protected abstract recibir(resultado: T): boolean;

  /** Atajo para el caso habitual: vacío es que ninguna tabla trajo filas. */
  protected sinFilas(...tablas: TablaReporteResultado[]): boolean {
    return tablas.every((t) => t.body.length === 0);
  }

  protected onAsesorSeleccionado(asesor: AsesorSec | null): void {
    this.asesorSeleccionado.set(asesor);
    if (!asesor) return;

    this.cargando.set(true);
    this.consultar(asesor).subscribe({
      next: (resultado) => {
        const vacio = this.recibir(resultado);
        this.cargando.set(false);
        if (vacio) this.toast.advertencia('Sin resultados', this.avisoSinResultados);
      },
      error: () => {
        this.toast.error(this.errorDeCarga, 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}
