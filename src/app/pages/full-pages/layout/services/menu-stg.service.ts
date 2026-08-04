import { Injectable, inject, signal } from '@angular/core';
import { ModSysAdminService } from '../../../../core/winder/instances/mod-sys-admin.service';
import { mapMaterialIconToPrimeIcons } from '../utils/material-to-primeicons.util';
import type { SidebarIcon, SidebarNavRuta } from '../interfaces/sidebar.model';

/**
 * Ítem crudo del árbol de menú del backend Ant (`list_sec` / `menu_response`).
 *
 * Nombres de campo tal cual los devuelve STG — ver
 * stg-app-mis-r22/src/app/pages/full-pages/layout/services/navigation.service.ts.
 */
interface AntMenuItem {
  cod_sec: string;
  cod_par?: string | null;
  desc_sec: string;
  /** Ruta del sistema en el backend (ej: "comercial/dashboard"). */
  act_sec?: string;
  icon_sec?: string;
  order_sec?: number;
}

/**
 * Árbol de menú de STG (list_sec) — única fuente de verdad, compartida entre
 * el sidebar (Col 1/Col 2) y el breadcrumb del header. Antes cada uno lo
 * recalculaba por su cuenta: el sidebar mostraba los `desc_sec` reales, pero
 * el breadcrumb no tenía acceso al árbol y terminaba mostrando los segmentos
 * crudos de la URL (códigos de `act_sec`) en vez de las etiquetas reales.
 */
@Injectable({ providedIn: 'root' })
export class MenuStgService {
  private readonly modSysAdminService = inject(ModSysAdminService);

  /** Sistemas de primer nivel del backend Ant (STG), para Col 1 del sidebar. */
  readonly sistemas = signal<SidebarIcon[]>([]);

  /** Nodos de segundo nivel+ de cada sistema STG (cod_par → hijos), para Col 2 y el breadcrumb. */
  readonly hijosPorSistema = signal<Record<string, SidebarNavRuta[]>>({});

  private cargado = false;

  /** Carga el menú una sola vez por sesión; llamadas repetidas no vuelven a pedirlo. */
  cargar(email: string): void {
    if (this.cargado) return;
    this.cargado = true;

    this.modSysAdminService.getMenuItems(email).subscribe({
      next: (response) => {
        const body = response.body as { menu_response?: AntMenuItem[] } | null;
        const items = body?.menu_response ?? [];

        const padres = items
          .filter((item) => !item.cod_par)
          .sort((a, b) => (a.order_sec ?? 0) - (b.order_sec ?? 0));

        // Árbol de nodos (cod_par → hijos, profundidad arbitraria) de cada
        // sistema. Se calcula antes que `sistemas` porque determina si el
        // ícono abre un panel o navega directo (ver `tienePanel`/`ruta`).
        const hijosPorId: Record<string, SidebarNavRuta[]> = {};
        for (const padre of padres) {
          const hijos = this.construirHijos(padre.cod_sec, items);
          if (hijos) {
            hijosPorId[padre.cod_sec] = hijos;
          }
        }

        const sistemas: SidebarIcon[] = padres.map((item) => {
          const tienePanel = !!hijosPorId[item.cod_sec];
          return {
            // `cod_sec` es el identificador único que entrega STG — a
            // diferencia del slug derivado de `act_sec`, no colisiona entre
            // sistemas distintos que comparten el mismo primer segmento de
            // ruta (ej. varios reportes bajo "reportes/...").
            id: item.cod_sec,
            tipo: 'remote' as const,
            // STG usa nombres de Material Icons (icon_sec); se traduce al
            // equivalente más parecido en PrimeIcons (ver material-to-primeicons.util).
            icono: mapMaterialIconToPrimeIcons(item.icon_sec),
            etiqueta: item.desc_sec,
            // Sin hijos en list_sec: no hay nada que mostrar en el panel,
            // así que el ícono navega directo a su propia ruta.
            ruta: tienePanel ? undefined : this.rutaDeAntItem(item),
            tienePanel,
          };
        });

        this.sistemas.set(sistemas);
        this.hijosPorSistema.set(hijosPorId);
      },
      error: (err) => {
        console.error('Error al cargar el menú de sistemas (STG):', err);
      },
    });
  }

  /**
   * Ruta absoluta del Host para un nodo del menú de STG (padre o hijo).
   *
   * `act_sec` ya viene con la ruta completa desde el root (ej. `app/ranking-k`)
   * — el legado solo le anteponía la barra (`sidenav.template.html`:
   * `[routerLink]="'/' + item.state"`), nunca un prefijo `/app/` adicional.
   * Anteponerlo acá duplicaba el segmento (`/app/app/ranking-k`).
   */
  private rutaDeAntItem(item: AntMenuItem): string {
    const ruta = (item.act_sec ?? item.cod_sec ?? '').replace(/^\/+/, '');
    return `/${ruta}`;
  }

  /**
   * Árbol recursivo de hijos de `codPadre` (profundidad arbitraria — STG
   * anida secciones/subsecciones/módulos sin límite fijo). Un nodo con
   * hijos propios es un grupo (sin `ruta`, solo expande/colapsa); un nodo
   * sin hijos es una hoja que navega a su `act_sec`.
   *
   * Comparación por String(): Ant a veces manda cod_sec/cod_par con tipos
   * mixtos (number vs string) entre filas — con === estricto se perdían
   * hijos válidos silenciosamente.
   */
  private construirHijos(codPadre: string, items: AntMenuItem[]): SidebarNavRuta[] | undefined {
    const hijos = items
      .filter((item) => item.cod_par != null && String(item.cod_par) === String(codPadre))
      .sort((a, b) => (a.order_sec ?? 0) - (b.order_sec ?? 0))
      .map((hijo) => {
        const nietos = this.construirHijos(hijo.cod_sec, items);
        return {
          etiqueta: hijo.desc_sec,
          ruta: nietos ? undefined : this.rutaDeAntItem(hijo),
          hijos: nietos,
        };
      });

    return hijos.length > 0 ? hijos : undefined;
  }

  /**
   * Busca en todos los sistemas la hoja cuya `ruta` coincide con la URL
   * activa, y devuelve tanto el sistema al que pertenece como la cadena de
   * etiquetas reales de sus ancestros. La usa el breadcrumb del header para
   * mostrar p. ej. "Actividad Mensual › Clientes › CMG Clientes Flujo" en
   * vez de los segmentos crudos de la URL.
   *
   * No se puede inferir el sistema a partir de la posición del segmento en
   * la URL: el slug real del sistema (`cod_sec`) no aparece en ningún
   * segmento propio — va embebido dentro de `act_sec`, ya consumido en la
   * `ruta` completa de cada hoja. Por eso se recorren todos los árboles
   * hasta encontrar la hoja exacta.
   *
   * Devuelve `null` si el árbol aún no cargó o la ruta no corresponde a
   * ninguna hoja conocida (el llamador decide el fallback).
   */
  buscarPorRuta(ruta: string): { sistemaId: string; etiquetas: string[] } | null {
    for (const [sistemaId, hijos] of Object.entries(this.hijosPorSistema())) {
      const etiquetas = this.buscarCadena(hijos, ruta);
      if (etiquetas) return { sistemaId, etiquetas };
    }
    return null;
  }

  private buscarCadena(nodos: SidebarNavRuta[], ruta: string): string[] | null {
    for (const nodo of nodos) {
      if (nodo.ruta && nodo.ruta === ruta) {
        return [nodo.etiqueta];
      }
      if (nodo.hijos) {
        const cadena = this.buscarCadena(nodo.hijos, ruta);
        if (cadena) return [nodo.etiqueta, ...cadena];
      }
    }
    return null;
  }
}
