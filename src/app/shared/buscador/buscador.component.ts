import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { BuscadorService, tokenizarConsulta } from './buscador.service';
import { FUENTE_BUSQUEDA } from './fuente-busqueda';
import type { ConfiguracionIndice, RegistroBuscable } from './buscador.model';

/** Facetas que se ofrecen como chips, con la etiqueta del grupo. */
const FACETAS = [{ nombre: 'tipo', etiqueta: 'Tipo' }] as const;

type Faceta = (typeof FACETAS)[number]['nombre'];

/**
 * Configuración del índice. El orden de `atributosBuscables` importa: alimenta
 * el criterio "atributo" del ranking, así que un match en el nombre del ítem
 * pesa más que el mismo match en su ubicación.
 */
const CONFIG: ConfiguracionIndice<RegistroBuscable> = {
  atributosBuscables: [
    { nombre: 'etiqueta', valor: (r) => r.etiqueta },
    { nombre: 'ubicacion', valor: (r) => r.ubicacion },
  ],
  atributosFacetables: [{ nombre: 'tipo', valor: (r) => r.tipo }],
  // Con los 5 criterios textuales empatados: primero lo accionable (abrir una
  // pantalla) y después las carpetas, que solo llevan a otra lista.
  rankingPersonalizado: (a, b) => Number(a.tipo === 'Carpeta') - Number(b.tipo === 'Carpeta'),
  id: (r) => r.id,
};

const MAXIMO_RESULTADOS = 8;

/**
 * Búsqueda instantánea con la relevancia de Algolia (ver `BuscadorService`):
 * tolera typos, matchea por prefijo la palabra que se está tecleando, resalta
 * lo que coincidió y deja refinar por módulo y por tipo.
 *
 * No conoce ningún módulo: se alimenta de las fuentes registradas en
 * `FUENTE_BUSQUEDA`, cada una responsable de aportar la data que tiene cargada
 * y de respetar los permisos del usuario.
 */
@Component({
  selector: 'app-buscador',
  standalone: true,
  templateUrl: './buscador.component.html',
})
export class BuscadorComponent {
  private readonly buscador = inject(BuscadorService);
  private readonly fuentes = inject(FUENTE_BUSQUEDA, { optional: true }) ?? [];

  protected readonly consulta = signal('');
  protected readonly enfocado = signal(false);
  protected readonly filtros = signal<Record<Faceta, string[]>>({ tipo: [] });

  /**
   * Registros de todas las fuentes. Es un `computed`, así que si un módulo
   * carga su data mientras el buscador está abierto, entra sola al índice.
   */
  private readonly registros = computed<RegistroBuscable[]>(() => this.fuentes.flatMap((fuente) => fuente.registros()));

  /** El índice se rearma solo cuando cambian los registros, no en cada tecla. */
  private readonly indice = computed(() => this.buscador.crearIndice(CONFIG, this.registros()));

  protected readonly respuesta = computed(() =>
    this.indice().buscar(this.consulta(), {
      // Si la consulta completa no da nada, se sueltan palabras desde el final
      // antes que devolver una lista vacía.
      estrategiaSinResultados: 'ultimas',
      maximoResultados: MAXIMO_RESULTADOS,
      filtrosFaceta: this.filtros(),
    })
  );

  protected readonly resultados = computed(() => this.respuesta().resultados);

  /** El panel solo aparece con algo tecleado: sin consulta no hay nada que sugerir. */
  protected readonly desplegado = computed(() => this.enfocado() && this.consulta().trim().length > 0);

  /**
   * Opción marcada para el teclado. Vuelve a la primera cuando cambia lo que el
   * usuario pidió —la consulta o los filtros—, y NO cuando se rearma el índice:
   * un módulo puede terminar de cargar su data de fondo y eso no debería
   * moverle la selección de abajo.
   */
  protected readonly indiceActivo = linkedSignal<string, number>({
    source: () => `${this.consulta()} ${JSON.stringify(this.filtros())}`,
    computation: () => 0,
  });

  /**
   * Chips de refinamiento agrupados por faceta, cada grupo con su etiqueta.
   *
   * Solo se ofrece "Tipo". Antes había también una faceta por módulo, pero sus
   * valores se confundían con los del tipo ("Reportes" el módulo contra
   * "Reporte" el tipo) y el módulo ya se lee en la ubicación de cada resultado.
   */
  protected readonly grupos = computed(() => {
    const facetas = this.respuesta().facetas;
    const activos = this.filtros();

    return FACETAS.map(({ nombre, etiqueta }) => ({
      faceta: nombre,
      etiqueta,
      valores: Object.entries(facetas[nombre] ?? {})
        .map(([valor, conteo]) => ({ valor, conteo, activo: activos[nombre].includes(valor) }))
        .sort((a, b) => b.conteo - a.conteo || a.valor.localeCompare(b.valor, 'es')),
    }));
  });

  /** Solo vale la pena ofrecer una faceta si hay más de una opción o si ya hay una activa. */
  protected readonly gruposVisibles = computed(() =>
    this.grupos().filter((g) => g.valores.length > 1 || g.valores.some((v) => v.activo))
  );

  protected readonly hayFiltros = computed(() => Object.values(this.filtros()).some((v) => v.length > 0));

  /**
   * True cuando hubo que soltar palabras para encontrar algo, así se avisa que
   * lo que se está viendo no matchea la consulta entera.
   */
  protected readonly consultaRelajada = computed(() => {
    const { palabrasUsadas, consulta } = this.respuesta();
    return palabrasUsadas > 0 && palabrasUsadas < tokenizarConsulta(consulta).length;
  });

  protected onConsulta(evento: Event): void {
    this.consulta.set((evento.target as HTMLInputElement).value);
  }

  protected limpiar(): void {
    this.consulta.set('');
    this.filtros.set({ tipo: [] });
  }

  protected cerrar(): void {
    this.enfocado.set(false);
  }

  /** Un clic sobre un chip lo activa; otro lo saca (refinamiento de un solo valor por faceta). */
  protected alternarFaceta(faceta: Faceta, valor: string): void {
    this.filtros.update((actuales) => ({
      ...actuales,
      [faceta]: actuales[faceta].includes(valor) ? [] : [valor],
    }));
  }

  protected onTeclado(evento: KeyboardEvent): void {
    if (evento.key === 'Escape') {
      if (this.consulta()) this.limpiar();
      else this.cerrar();
      return;
    }

    if (!this.desplegado()) return;
    const total = this.resultados().length;
    if (total === 0) return;

    switch (evento.key) {
      case 'ArrowDown':
        evento.preventDefault();
        this.indiceActivo.update((i) => (i + 1) % total);
        break;
      case 'ArrowUp':
        evento.preventDefault();
        this.indiceActivo.update((i) => (i - 1 + total) % total);
        break;
      case 'Home':
        evento.preventDefault();
        this.indiceActivo.set(0);
        break;
      case 'End':
        evento.preventDefault();
        this.indiceActivo.set(total - 1);
        break;
      case 'Enter': {
        evento.preventDefault();
        const elegido = this.resultados()[this.indiceActivo()];
        if (elegido) this.abrir(elegido.objeto);
        break;
      }
    }
  }

  /** Abrir es cosa de la fuente: ella sabe qué significa su propio registro. */
  protected abrir(registro: RegistroBuscable): void {
    this.consulta.set('');
    this.cerrar();
    registro.abrir();
  }

  protected idOpcion(posicion: number): string {
    return `mis-buscador-opcion-${posicion}`;
  }
}
