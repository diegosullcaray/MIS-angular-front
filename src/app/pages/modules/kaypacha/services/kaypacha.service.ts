import { Injectable, inject, signal } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModKaypachaService } from '../../../../core/winder/instances/mod-kaypacha.service';
import type { CategoriaRanking, FilaDetalleRanking } from '../models/kaypacha.model';

interface ListRankingBody {
  list?: Array<{ JSONLIST: string }>;
}

interface DetalleRankingBody {
  list?: Array<{ JSONLIST: string }>;
}

/**
 * Fachada del módulo Kaypacha (Ranking) — expone las categorías del ranking
 * como signals para alimentar el panel Col 2 del sidebar (sección
 * "Categoría", ver `sidebar.component.ts`) y la vista de detalle.
 */
@Injectable({ providedIn: 'root' })
export class KaypachaService {
  private readonly ant = inject(ModKaypachaService);

  readonly categorias = signal<CategoriaRanking[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  private cargado = false;

  /** Carga la lista de categorías una sola vez por sesión; llamadas repetidas no vuelven a pedirla. */
  cargarCategorias(): void {
    if (this.cargado) return;
    this.cargado = true;
    this.cargando.set(true);
    this.error.set(null);

    this.ant.getListRanking().subscribe({
      next: (response) => {
        const body = response.body as ListRankingBody | null;
        const json = body?.list?.[0]?.JSONLIST;
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

  /** Busca una categoría ya cargada por su `rdestip` (para mostrar su nombre en el detalle). */
  buscarCategoria(rdestip: string): CategoriaRanking | undefined {
    return this.categorias().find((c) => c.rdestip === rdestip);
  }

  /** Desglose del ranking de una categoría puntual. */
  obtenerDetalle(rdestip: string): Observable<FilaDetalleRanking[]> {
    return this.ant.getDetalleRanking(rdestip).pipe(
      map((response) => {
        const body = response.body as DetalleRankingBody | null;
        const json = body?.list?.[0]?.JSONLIST;
        return json ? (JSON.parse(json) as FilaDetalleRanking[]) : [];
      })
    );
  }
}
