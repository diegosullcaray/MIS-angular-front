import { Injectable, inject, signal } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModKaypachaService } from '../../../../core/winder/instances/mod-kaypacha.service';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import type { CategoriaRanking, FilaDetalleRanking } from '../models/kaypacha.model';

/**
 * Forma real de `response.body` para las rutas `kaypacha.*` — el backend
 * siempre envuelve el payload bajo la clave del `responseName` del Strand
 * ("resultado", ver `ModKaypachaService`), igual que el legado STG
 * (`principal.component.ts`: `let r = x.body.resultado`).
 */
interface KaypachaResponseBody {
  resultado?: {
    list?: Array<{ JSONLIST: string }>;
  };
}

/**
 * Fachada del módulo Kaypacha (Ranking) — expone las categorías del ranking
 * como signals para alimentar el panel Col 2 del sidebar (sección
 * "Categoría", ver `sidebar.component.ts`) y la vista de detalle.
 */
@Injectable({ providedIn: 'root' })
export class KaypachaService {
  private readonly ant = inject(ModKaypachaService);
  private readonly shell = inject(ShellStateService);

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

  /** Busca una categoría ya cargada por su `rdestip` (para mostrar su nombre en el detalle). */
  buscarCategoria(rdestip: string): CategoriaRanking | undefined {
    return this.categorias().find((c) => c.rdestip === rdestip);
  }

  /** Desglose del ranking de una categoría puntual. */
  obtenerDetalle(rdestip: string): Observable<FilaDetalleRanking[]> {
    return this.ant.getDetalleRanking(rdestip).pipe(
      map((response) => {
        const body = response.body as KaypachaResponseBody | null;
        const json = body?.resultado?.list?.[0]?.JSONLIST;
        return json ? (JSON.parse(json) as FilaDetalleRanking[]) : [];
      })
    );
  }
}
