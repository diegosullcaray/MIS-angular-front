import { Injectable } from '@angular/core';
import { Observable, of, shareReplay, tap } from 'rxjs';
import type { HierarquiaNodo } from '../../../pages/modules/reportes/models/jerarquia.model';

/** Prefijo de las entradas en `sessionStorage`. */
const PREFIJO = 'mis.jerarquia.';

/**
 * Caché de la jerarquía organizativa.
 *
 * Es la pieza que faltaba respecto del STG. Allá, `CacheService` guarda cada
 * nivel resuelto y `locally()` decide en una línea —`!isCache(r) ? external(r)
 * : internal(r)`— si sale a la red o lee de disco. Acá cada pantalla que
 * montaba el selector volvía a pedir `base_hier` + `level_hier` + el nivel
 * siguiente, **en serie**, antes de que arrancara la consulta del reporte: tres
 * viajes de ida y vuelta que el usuario espera mirando un spinner, y que se
 * repetían íntegros al cambiar de reporte. Eso es buena parte de lo que se
 * siente como "el legacy carga más rápido".
 *
 * Dos niveles, a propósito:
 *
 * - **Memoria** (`Map` de observables). Sirve la navegación dentro de la SPA y,
 *   de yapa, comparte la petición en vuelo: si dos componentes piden el mismo
 *   nivel a la vez sale una sola request. El STG dispara las dos, porque su
 *   caché recién se escribe en el `subscribe`.
 * - **`sessionStorage`**. Sobrevive al F5, que es lo que hace el caché del STG.
 *
 * Por qué `sessionStorage` y no `localStorage` como el STG: la clave del STG
 * —`{tip_cod, cod_rel, level_load, jerar}`— **no lleva la fecha de corte**, así
 * que su caché puede servir el árbol de ayer. Acá la fecha va en la clave y
 * además el caché muere con la pestaña: se gana la velocidad sin heredar esa
 * forma de quedar desactualizado.
 */
@Injectable({ providedIn: 'root' })
export class JerarquiaCacheService {
  private readonly enMemoria = new Map<string, Observable<HierarquiaNodo[]>>();

  /**
   * Devuelve lo cacheado para esa clave, o registra lo que produce `pedir()`.
   *
   * `shareReplay({ refCount: false })` es deliberado: sin él el valor se
   * descartaría cuando el último suscriptor se va —o sea, al salir de la
   * pantalla— y el siguiente montaje volvería a la red, que es justo lo que se
   * está arreglando.
   */
  obtener(clave: string, pedir: () => Observable<HierarquiaNodo[]>): Observable<HierarquiaNodo[]> {
    const yaEnMemoria = this.enMemoria.get(clave);
    if (yaEnMemoria) return yaEnMemoria;

    const deSesion = this.leer(clave);
    if (deSesion) {
      const flujo = of(deSesion);
      this.enMemoria.set(clave, flujo);
      return flujo;
    }

    const flujo = pedir().pipe(
      tap((nodos) => this.guardar(clave, nodos)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.enMemoria.set(clave, flujo);
    return flujo;
  }

  /** Clave de una raíz: depende del usuario y de la jerarquía pedida. */
  claveBase(email: string, codJerarquia: number): string {
    return `base|${email}|${codJerarquia}`;
  }

  /**
   * Clave de un nivel. Incluye la fecha de corte porque la jerarquía vigente
   * depende de ella: sin `fec` en la clave, cambiar de corte seguiría mostrando
   * el árbol del corte anterior.
   */
  claveNivel(
    codJerarquia: number,
    nivel: number,
    tipCod: number,
    codRels: readonly string[],
    fec?: string,
  ): string {
    return `nivel|${codJerarquia}|${nivel}|${tipCod}|${[...codRels].sort().join(',')}|${fec ?? ''}`;
  }

  /**
   * Vacía el caché entero. Corre al cerrar sesión y al cambiar de usuario
   * alterno: el árbol que ve cada persona depende de quién es.
   */
  limpiar(): void {
    this.enMemoria.clear();
    try {
      const claves = Object.keys(sessionStorage).filter((k) => k.startsWith(PREFIJO));
      for (const clave of claves) sessionStorage.removeItem(clave);
    } catch {
      // Modo privado o storage bloqueado: la memoria ya se limpió, que es lo que importa.
    }
  }

  /** Cuántas entradas tiene en memoria. Para los tests y el diagnóstico. */
  get tamano(): number {
    return this.enMemoria.size;
  }

  private leer(clave: string): HierarquiaNodo[] | null {
    try {
      const crudo = sessionStorage.getItem(PREFIJO + clave);
      if (!crudo) return null;
      const valor: unknown = JSON.parse(crudo);
      return Array.isArray(valor) ? (valor as HierarquiaNodo[]) : null;
    } catch {
      // JSON corrupto o storage inaccesible: se trata como si no hubiera nada.
      return null;
    }
  }

  private guardar(clave: string, nodos: HierarquiaNodo[]): void {
    try {
      sessionStorage.setItem(PREFIJO + clave, JSON.stringify(nodos));
    } catch {
      // Cuota llena o modo privado: el caché de memoria sigue sirviendo.
    }
  }
}
