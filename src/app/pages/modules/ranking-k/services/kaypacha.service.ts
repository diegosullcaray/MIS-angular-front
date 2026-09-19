import { DestroyRef, Injectable, effect, inject, signal, untracked } from '@angular/core';
import { Observable, Subscription, map } from 'rxjs';
import { identidadConsulta } from '../../../../shared/utils/identidad-consulta.util';
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

  private readonly categoriasState = signal<CategoriaRanking[]>([]);
  readonly categorias = this.categoriasState.asReadonly();
  private readonly cargandoState = signal(false);
  readonly cargando = this.cargandoState.asReadonly();
  private readonly errorState = signal<string | null>(null);
  readonly error = this.errorState.asReadonly();

  private cargado = false;
  private consulta?: Subscription;
  private identidad = '';
  readonly ruta = '/app/ranking-k';

  constructor() {
    effect(() => {
      const clave = identidadConsulta(this.shell.usuarioActivo());
      untracked(() => this.sincronizarIdentidad(clave));
    });
    inject(DestroyRef).onDestroy(() => this.consulta?.unsubscribe());
  }

  private sincronizarIdentidad(clave = identidadConsulta(this.shell.usuarioActivo())): void {
    if (clave === this.identidad) return;
    this.consulta?.unsubscribe();
    this.identidad = clave;
    this.cargado = false;
    this.categoriasState.set([]);
    this.cargandoState.set(false);
    this.errorState.set(null);
  }

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
    this.sincronizarIdentidad();
    if (this.cargado) return;
    const identidad = this.identidad;
    this.consulta?.unsubscribe();
    this.cargado = true;
    this.cargandoState.set(true);
    this.errorState.set(null);

    const codBt = this.shell.usuarioActivo()?.codBt;
    if (!codBt) {
      this.errorState.set('No se pudo determinar tu código de negocio/agencia.');
      this.cargandoState.set(false);
      this.cargado = false;
      return;
    }

    this.consulta = this.ant.getListRanking(codBt).pipe(
      map((response) => {
        const body = response.body as KaypachaResponseBody | null;
        const json = body?.resultado?.list?.[0]?.JSONLIST;
        const categorias: unknown = json ? JSON.parse(json) : [];
        if (!Array.isArray(categorias)) throw new Error('Lista de categorías inválida.');
        return categorias as CategoriaRanking[];
      }),
    ).subscribe({
      next: (categorias) => {
        if (identidad !== identidadConsulta(this.shell.usuarioActivo())) return;
        this.categoriasState.set(categorias);
        this.cargandoState.set(false);
      },
      error: () => {
        if (identidad !== identidadConsulta(this.shell.usuarioActivo())) return;
        this.errorState.set('No se pudo cargar la lista de categorías.');
        this.cargandoState.set(false);
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
