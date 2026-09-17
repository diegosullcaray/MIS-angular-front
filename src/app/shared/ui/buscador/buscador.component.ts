import { Component, computed, ElementRef, inject, input, linkedSignal, signal, viewChild } from '@angular/core';
import { crearIndice, tokenizarConsulta } from './buscador.service';
import { FUENTE_BUSQUEDA } from './fuente-busqueda';
import type { ConfiguracionIndice, RegistroBuscable } from './buscador.model';

const FACETAS = [{ nombre: 'tipo', etiqueta: 'Tipo' }] as const;

type Faceta = (typeof FACETAS)[number]['nombre'];

const CONFIG: ConfiguracionIndice<RegistroBuscable> = {
  atributosBuscables: [
    { nombre: 'etiqueta', valor: (r) => r.etiqueta },
    { nombre: 'ubicacion', valor: (r) => r.ubicacion },
  ],
  atributosFacetables: [{ nombre: 'tipo', valor: (r) => r.tipo }],
  rankingPersonalizado: (a, b) => Number(a.tipo === 'Carpeta') - Number(b.tipo === 'Carpeta'),
  id: (r) => r.id,
};

const MAXIMO_RESULTADOS = 50;
let siguienteInstancia = 0;

@Component({
  selector: 'app-buscador',
  standalone: true,
  templateUrl: './buscador.component.html',
})
export class BuscadorComponent {
  private readonly fuentes = inject(FUENTE_BUSQUEDA, { optional: true }) ?? [];
  private readonly entrada = viewChild<ElementRef<HTMLInputElement>>('entrada');
  protected readonly idLista = `mis-buscador-lista-${++siguienteInstancia}`;

  readonly origenes = input<readonly string[]>();
  readonly alcance = input<string>();

  protected readonly consulta = signal('');
  protected readonly enfocado = signal(false);
  protected readonly filtros = signal<Record<Faceta, string[]>>({ tipo: [] });

  private readonly registros = computed<RegistroBuscable[]>(() => {
    const registros = this.fuentes.flatMap((fuente) => fuente.registros());
    const origenes = this.origenes();
    return origenes?.length ? registros.filter((registro) => origenes.includes(registro.origen)) : registros;
  });

  protected readonly placeholder = computed(() =>
    this.alcance() ? `Buscar en ${this.alcance()}…` : 'Buscar en todos los sistemas…'
  );

  protected readonly etiquetaAria = computed(() =>
    this.alcance()
      ? `Buscar reportes y carpetas de ${this.alcance()}`
      : 'Buscar reportes y carpetas en todos los sistemas'
  );

  private readonly indice = computed(() => crearIndice(CONFIG, this.registros()));

  protected readonly respuesta = computed(() =>
    this.indice().buscar(this.consulta(), {
      estrategiaSinResultados: 'ultimas',
      maximoResultados: MAXIMO_RESULTADOS,
      filtrosFaceta: this.filtros(),
    })
  );

  protected readonly resultados = computed(() => this.respuesta().resultados);

  protected readonly desplegado = computed(() => this.enfocado() && this.consulta().trim().length > 0);

  protected readonly indiceActivo = linkedSignal<string, number>({
    source: () => `${this.consulta()} ${JSON.stringify(this.filtros())}`,
    computation: () => 0,
  });

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

  protected readonly gruposVisibles = computed(() =>
    this.grupos().filter((g) => g.valores.length > 1 || g.valores.some((v) => v.activo))
  );

  protected readonly hayFiltros = computed(() => Object.values(this.filtros()).some((v) => v.length > 0));

  protected readonly consultaRelajada = computed(() => {
    const { palabrasUsadas, consulta } = this.respuesta();
    return palabrasUsadas > 0 && palabrasUsadas < tokenizarConsulta(consulta).length;
  });

  protected onConsulta(evento: Event): void {
    this.consulta.set((evento.target as HTMLInputElement).value);
  }

  enfocar(): void {
    this.entrada()?.nativeElement.focus();
  }

  protected limpiar(): void {
    this.consulta.set('');
    this.filtros.set({ tipo: [] });
  }

  protected cerrar(): void {
    this.enfocado.set(false);
  }

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

  protected abrir(registro: RegistroBuscable): void {
    this.consulta.set('');
    this.cerrar();
    registro.abrir();
  }

  protected idOpcion(posicion: number): string {
    return `${this.idLista}-opcion-${posicion}`;
  }
}
