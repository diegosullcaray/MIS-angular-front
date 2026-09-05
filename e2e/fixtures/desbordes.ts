import type { Page } from '@playwright/test';

/** Un elemento que se sale del viewport, con lo necesario para encontrarlo en el código. */
export interface Desborde {
  readonly selector: string;
  /** Ancho del contenido contra el ancho disponible. */
  readonly scrollWidth: number;
  readonly clientWidth: number;
  /** Cuánto se pasa del borde derecho del viewport, en px. */
  readonly excedeViewport: number;
  readonly texto: string;
}

/**
 * Busca desbordes horizontales reales, ya renderizados.
 *
 * Dos cosas distintas, y las dos importan:
 *  - un elemento cuyo contenido no entra y NO tiene cómo desplazarse
 *    (`overflow-x: visible`): eso empuja la página entera;
 *  - un elemento que se pinta más allá del borde derecho del viewport.
 *
 * Se ignoran los que sí declaran `auto`/`scroll`/`hidden`: una tabla ancha
 * dentro de su contenedor con scroll propio es la solución, no el problema.
 */
export async function buscarDesbordes(page: Page): Promise<Desborde[]> {
  return page.evaluate(() => {
    const salida: Desborde[] = [];
    const anchoViewport = document.documentElement.clientWidth;

    const identificar = (el: Element): string => {
      const clases = String((el as HTMLElement).className || '')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 3)
        .join('.');
      const id = el.id ? `#${el.id}` : '';
      return `${el.tagName.toLowerCase()}${id}${clases ? '.' + clases : ''}`;
    };

    /**
     * Un elemento más ancho que el viewport NO es un defecto si algún ancestro
     * lo contiene: una tabla de 600px dentro de su contenedor con
     * `overflow-x: auto` es la solución, no el problema. Solo cuenta si escapa
     * hasta arriba sin que nadie la recorte ni le dé scroll.
     */
    const estaContenido = (el: HTMLElement): boolean => {
      let padre = el.parentElement;
      while (padre && padre !== document.body) {
        const ox = getComputedStyle(padre).overflowX;
        if (ox === 'auto' || ox === 'scroll' || ox === 'hidden' || ox === 'clip') {
          return padre.getBoundingClientRect().right <= anchoViewport + 1;
        }
        padre = padre.parentElement;
      }
      return false;
    };

    for (const el of Array.from(document.body.querySelectorAll<HTMLElement>('*'))) {
      const estilo = getComputedStyle(el);
      if (estilo.display === 'none' || estilo.visibility === 'hidden') continue;

      const caja = el.getBoundingClientRect();
      if (caja.width === 0 && caja.height === 0) continue;

      // Un contenedor ANCHO cuyo contenido no entra y que no puede desplazarse
      // empuja la página. Uno angosto (un chip, una etiqueta truncada) recorta a
      // propósito y no es un defecto: por eso el umbral de 25% del viewport.
      const esContenedor = caja.width >= anchoViewport * 0.25;
      const desbordaContenido =
        esContenedor &&
        el.scrollWidth > el.clientWidth + 1 &&
        ['visible', 'clip'].includes(estilo.overflowX) &&
        !estaContenido(el);
      // Sangrar por el borde derecho solo importa si nadie lo contiene: dentro
      // de un contenedor con scroll es normal y es la solución esperada.
      const sangraPorLaDerecha = caja.right > anchoViewport + 1 && caja.width > 0 && !estaContenido(el);

      if (desbordaContenido || sangraPorLaDerecha) {
        salida.push({
          selector: identificar(el),
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          excedeViewport: Math.max(0, Math.round(caja.right - anchoViewport)),
          texto: (el.textContent ?? '').trim().slice(0, 40),
        });
      }
    }

    // Se reportan solo los ANCESTROS: si un contenedor desborda, todos sus hijos
    // aparecen también y el informe se vuelve ilegible.
    return salida.filter((d, i) => salida.findIndex((o) => o.selector === d.selector) === i).slice(0, 15);
  });
}

/** `true` si la página entera tiene scroll horizontal. */
export async function paginaDesbordaEnHorizontal(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const raiz = document.scrollingElement ?? document.documentElement;
    return raiz.scrollWidth > raiz.clientWidth + 1;
  });
}

/** Elementos interactivos por debajo del objetivo táctil de 44×44 (WCAG 2.5.5 / HIG de Apple). */
export async function objetivosTactilesChicos(page: Page, minimo = 44): Promise<string[]> {
  return page.evaluate((min) => {
    const chicos: string[] = [];
    const interactivos = 'button, a[href], [role="button"], input:not([type="hidden"]), select, summary';

    for (const el of Array.from(document.body.querySelectorAll<HTMLElement>(interactivos))) {
      const estilo = getComputedStyle(el);
      if (estilo.display === 'none' || estilo.visibility === 'hidden') continue;

      const caja = el.getBoundingClientRect();
      if (caja.width === 0 || caja.height === 0) continue;
      if (caja.width >= min && caja.height >= min) continue;

      const etiqueta =
        el.getAttribute('aria-label') ?? (el.textContent ?? '').trim().slice(0, 24) ?? el.tagName;
      chicos.push(`${etiqueta || el.tagName} (${Math.round(caja.width)}×${Math.round(caja.height)})`);
    }
    return [...new Set(chicos)].slice(0, 20);
  }, minimo);
}
