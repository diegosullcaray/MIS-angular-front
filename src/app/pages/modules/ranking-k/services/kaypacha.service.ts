import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModKaypachaService } from '../../../../core/winder/instances/mod-kaypacha.service';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import type { SidebarNavPanelConfig } from '../../../full-pages/layout/interfaces/sidebar.model';
import type { CategoriaRanking, DetalleRanking, FilaDetalleRanking, KaypachaResponseBody } from '../models';

/**
 * Fachada del módulo `ranking-k` — expone las categorías del ranking como
 * signals para la vista de detalle, y su panel de sidebar (`panel`, sección
 * "Categoría"). El ícono de Col 1 y su etiqueta NO se hardcodean acá: ya
 * existe un ítem real para este sistema en `list_sec` (STG) — `ruta`
 * identifica esa ruta para que `sidebar.component.ts` enganche este panel
 * al ítem real del backend, en vez de crear un ícono duplicado.
 */
@Injectable({ providedIn: 'root' })
export class KaypachaService {
  private readonly ant = inject(ModKaypachaService);
  private readonly shell = inject(ShellStateService);

  readonly categorias = signal<CategoriaRanking[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  private cargado = false;

  /** Ruta montada de este módulo — para que el sidebar identifique cuál de los ítems de STG le corresponde. */
  readonly ruta = '/app/ranking-k';

  /**
   * Panel de Col 2 de este módulo — empieza con la sección "Categoría".
   * Recibe el título/ícono reales del ítem de STG (`desc_sec`/`icon_sec`):
   * este módulo no inventa un nombre propio para el sistema, solo arma la
   * navegación de categorías que va debajo.
   */
  panelPara(titulo: string, icono: string): SidebarNavPanelConfig {
    return {
      tipo: 'host-admin',
      titulo,
      icono,
      secciones: [
        {
          titulo: 'Categoría',
          rutas: this.categorias().map((categoria) => ({
            etiqueta: categoria.name,
            ruta: `${this.ruta}/categoria/${categoria.rdestip}`,
          })),
        },
      ],
    };
  }

  /** Carga la lista de categorías una sola vez por sesión; llamadas repetidas no vuelven a pedirla. */
  cargarCategorias(): void {
    if (this.cargado) return;
    this.cargado = true;
    this.cargando.set(true);
    this.error.set(null);

    const codBt = this.shell.usuarioActivo()?.codBt;

    if (!codBt) {
      // Sin cod_bt el backend Ant responde 500 (lo requiere igual que el
      // legado STG) — se corta acá para no disparar una petición condenada.
      console.error('No se puede cargar el ranking Kaypacha: el usuario activo no tiene cod_bt.');
      this.error.set('No se pudo determinar tu código de negocio/agencia.');
      this.cargando.set(false);
      this.cargado = false;
      return;
    }

    this.ant.getListRanking(codBt).subscribe({
      next: (response) => {
        const body = response.body as KaypachaResponseBody | null;
        const json = body?.resultado?.list?.[0]?.JSONLIST;
        this.categorias.set(json ? (JSON.parse(json) as CategoriaRanking[]) : []);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar las categorías del ranking Kaypacha:', err);
        this.error.set('No se pudo cargar la lista de categorías.');
        this.cargando.set(false);
        this.cargado = false;
      },
    });
  }

  /** Recarga forzada (ej. botón "Reintentar" tras un error). */
  recargarCategorias(): void {
    this.cargado = false;
    this.cargarCategorias();
  }

  /**
   * Busca una categoría ya cargada por su `rdestip` (para mostrar su nombre
   * en el detalle). Compara como string: el route param siempre llega como
   * string, pero `rdestip` puede llegar como number desde el JSON del backend.
   */
  buscarCategoria(rdestip: string): CategoriaRanking | undefined {
    return this.categorias().find((c) => String(c.rdestip) === rdestip);
  }

  /** Desglose del ranking de una categoría puntual. */
  obtenerDetalle(rdestip: string): Observable<DetalleRanking> {
    return this.ant.getDetalleRanking(rdestip).pipe(
      map((response) => {
        const body = response.body as KaypachaResponseBody | null;
        const json = body?.resultado?.list?.[0]?.JSONLIST;
        const filas = json ? (JSON.parse(json) as FilaDetalleRanking[]) : [];

        const datTable = body?.resultado?.datTable;
        const fechaActualizacion = Array.isArray(datTable) ? datTable[0]?.fechaMax ?? null : null;

        return { filas, fechaActualizacion };
      })
    );
  }
}
