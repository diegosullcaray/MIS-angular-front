import { Injectable, inject, signal } from '@angular/core';
import { ModSysAdminService } from '../../../../core/winder/instances/mod-sys-admin.service';
import { mapMaterialIconToPrimeIcons } from '../utils/material-to-primeicons.util';
import type { SidebarIcon, SidebarNavRuta } from '../interfaces/sidebar.model';

/** Ítem crudo del árbol de menú del backend Ant (`list_sec`). */
interface AntMenuItem {
  cod_sec: string;
  cod_par?: string | null;
  desc_sec: string;
  act_sec?: string;
  icon_sec?: string;
  order_sec?: number;
}

@Injectable({ providedIn: 'root' })
export class MenuStgService {
  private readonly modSysAdminService = inject(ModSysAdminService);

  /** Sistemas principales para la Columna 1 del sidebar. */
  readonly sistemas = signal<SidebarIcon[]>([]);

  /** Nodos secundarios (paneles) y subrutas indexadas por sistema (Columna 2 / Breadcrumb). */
  readonly hijosPorSistema = signal<Record<string, SidebarNavRuta[]>>({});

  private emailCargado: string | null = null;

  /** Carga y construye el menú para un usuario. Evita llamadas duplicadas si el email no cambia. */
  cargar(email: string): void {
    if (this.emailCargado === email) return;
    this.emailCargado = email;

    this.modSysAdminService.getMenuItems(email).subscribe({
      next: (response) => {
        const items = (response.body as any)?.menu_response as AntMenuItem[] ?? [];

        // Optimización: Agrupar elementos por padre en un mapa (O(N)) para evitar usar 
        // filter() iterativamente en cada nivel recursivo de construirHijos.
        const porPadre = new Map<string, AntMenuItem[]>();
        const padres: AntMenuItem[] = [];

        for (const item of items) {
          const codPar = item.cod_par != null ? String(item.cod_par) : null;
          if (!codPar) {
            padres.push(item);
          } else {
            if (!porPadre.has(codPar)) porPadre.set(codPar, []);
            porPadre.get(codPar)!.push(item);
          }
        }

        padres.sort((a, b) => (a.order_sec ?? 0) - (b.order_sec ?? 0));

        const hijosPorId: Record<string, SidebarNavRuta[]> = {};
        
        const sistemas: SidebarIcon[] = padres.map((padre) => {
          const hijos = this.construirHijos(padre.cod_sec, porPadre);
          if (hijos) hijosPorId[padre.cod_sec] = hijos;

          return {
            id: padre.cod_sec,
            tipo: 'remote',
            icono: mapMaterialIconToPrimeIcons(padre.icon_sec),
            etiqueta: padre.desc_sec,
            ruta: hijos ? undefined : this.rutaDeAntItem(padre),
            tienePanel: !!hijos,
          };
        });

        this.sistemas.set(sistemas);
        this.hijosPorSistema.set(hijosPorId);
      },
      error: (err) => console.error('Error al cargar el menú de sistemas (STG):', err),
    });
  }

  /** Normaliza la ruta absoluta, asegurando el prefijo /app/ sin duplicarlo. */
  private rutaDeAntItem(item: AntMenuItem): string {
    const segmento = (item.act_sec || item.cod_sec || '').replace(/^\/+/, '');
    return segmento.startsWith('app/') ? `/${segmento}` : `/app/${segmento}`;
  }

  /** Construye recursivamente el árbol usando el mapa agrupado. */
  private construirHijos(codPadre: string, porPadre: Map<string, AntMenuItem[]>): SidebarNavRuta[] | undefined {
    // String() coercion previene fallos si Ant mezcla tipos (number vs string) en los IDs
    const hijosRaw = porPadre.get(String(codPadre));
    if (!hijosRaw?.length) return undefined;

    return hijosRaw
      .sort((a, b) => (a.order_sec ?? 0) - (b.order_sec ?? 0))
      .map((hijo) => {
        const nietos = this.construirHijos(hijo.cod_sec, porPadre);
        return {
          etiqueta: hijo.desc_sec,
          ruta: nietos ? undefined : this.rutaDeAntItem(hijo),
          hijos: nietos,
        };
      });
  }

  /**
   * Busca en el árbol una ruta activa para resolver el breadcrumb dinámicamente.
   * Retorna el ID del sistema y la cadena de nodos hasta la hoja (incluida),
   * para poder mostrar sus etiquetas y también reabrir el explorador en
   * cualquier carpeta intermedia (`NavegacionSistemasService.abrirEnCarpeta`).
   */
  buscarPorRuta(ruta: string): { sistemaId: string; nodos: SidebarNavRuta[] } | null {
    for (const [sistemaId, hijos] of Object.entries(this.hijosPorSistema())) {
      const nodos = this.buscarCadena(hijos, ruta);
      if (nodos) return { sistemaId, nodos };
    }
    return null;
  }

  private buscarCadena(nodos: SidebarNavRuta[], ruta: string): SidebarNavRuta[] | null {
    for (const nodo of nodos) {
      if (nodo.ruta === ruta) return [nodo];

      if (nodo.hijos) {
        const subCadena = this.buscarCadena(nodo.hijos, ruta);
        if (subCadena) return [nodo, ...subCadena];
      }
    }
    return null;
  }
}