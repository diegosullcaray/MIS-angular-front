import { Injectable } from '@angular/core';
import { Observable, of, shareReplay, tap } from 'rxjs';
import type { HierarquiaNodo } from '../../../pages/modules/reportes/models/jerarquia.model';

/** Prefijo de las entradas en `sessionStorage`. */
const PREFIJO = 'mis.jerarquia.';

/**
 * Caché de la jerarquía. Sin él, cada pantalla que monta el selector repite
 * `base_hier` + `level_hier` + el nivel siguiente EN SERIE antes de consultar
 * el reporte (44 pantallas lo montan).
 *
 * En memoria para la navegación —y de paso comparte la petición en vuelo— y en
 * `sessionStorage` para sobrevivir al F5. No `localStorage` como el STG: su
 * clave no lleva la fecha de corte y puede servir el árbol de ayer.
 */
@Injectable({ providedIn: 'root' })
export class JerarquiaCacheService {
  private readonly enMemoria = new Map<string, Observable<HierarquiaNodo[]>>();

  /**
   * Lo cacheado para esa clave, o lo que produzca `pedir()` la primera vez.
   * `refCount: false` es deliberado: si no, el valor se descartaría al salir de
   * la pantalla y el siguiente montaje volvería a la red.
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
