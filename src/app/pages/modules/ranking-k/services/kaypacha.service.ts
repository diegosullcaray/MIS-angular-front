import { Injectable, inject, signal } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModKaypachaService } from '../../../../core/winder/instances/mod-kaypacha.service';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import type { SidebarNavPanelConfig } from '../../../full-pages/layout/interfaces/sidebar.model';
import type { CategoriaRanking, DetalleRanking, FilaDetalleRanking } from '../models/categoria-ranking.model';
import type { KaypachaResponseBody } from '../models/kaypacha-response.model';

/** Servicio fachada para el módulo de ranking Kaypacha. */
@Injectable({ providedIn: 'root' })
export class KaypachaService {
  private readonly ant = inject(ModKaypachaService);
  private readonly shell = inject(ShellStateService);

  readonly categorias = signal<CategoriaRanking[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  private cargado = false;
  readonly ruta = '/app/ranking-k';

  /** Genera la configuración del panel de navegación para el sidebar. */
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

  /** Carga la lista de categorías del ranking si no han sido cargadas previamente. */
  cargarCategorias(): void {
    if (this.cargado) return;
    this.cargado = true;
    this.cargando.set(true);
    this.error.set(null);

    const codBt = this.shell.usuarioActivo()?.codBt;
    if (!codBt) {
      console.error('No se puede cargar el ranking Kaypacha: sin cod_bt en el usuario activo.');
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

  /** Recarga la lista de categorías. */
  recargarCategorias(): void {
    this.cargado = false;
    this.cargarCategorias();
  }

  /** Busca una categoría cargada por su ID. */
  buscarCategoria(rdestip: string): CategoriaRanking | undefined {
    return this.categorias().find((c) => String(c.rdestip) === rdestip);
  }

  /** Obtiene el detalle de posiciones para una categoría. */
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
