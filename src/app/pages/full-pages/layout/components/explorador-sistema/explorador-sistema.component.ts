import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { WindowPanelComponent } from '../../../../../shared/ui/window-panel/window-panel.component';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { NavegacionSistemasService } from '../../services/navegacion-sistemas.service';
import type { SidebarNavRuta } from '../../interfaces/sidebar.model';

/** Migas de pan del explorador: la raíz es el sistema, el resto son carpetas abiertas. */
interface MigaExplorador {
  etiqueta: string;
  /** Índice dentro de la pila de carpetas; `-1` es la raíz del sistema. */
  indice: number;
}

/**
 * Explorador de archivos del sistema activo — reemplaza al panel de links de
 * la Col 2 como forma de navegar dentro de un módulo. Las ramas del árbol
 * (nodos con `hijos`) se muestran como carpetas en las que se entra, y las
 * hojas como archivos que abren su pantalla.
 *
 * Vive en el área de contenido y sirve a TODOS los sistemas con subnavegación
 * (Reportes, Analista, Ranking Kaypacha, Host Principal y cualquier sistema
 * del menú STG), porque todos entran por la misma superficie:
 * `ShellStateService.contenidoPendienteSeleccion`.
 */
@Component({
  selector: 'app-explorador-sistema',
  standalone: true,
  imports: [WindowPanelComponent, TooltipModule],
  templateUrl: './explorador-sistema.component.html',
})
export class ExploradorSistemaComponent {
  private readonly navegacion = inject(NavegacionSistemasService);
  private readonly shell = inject(ShellStateService);
  private readonly router = inject(Router);

  protected readonly panel = this.navegacion.panelActivo;

  /** Carpetas abiertas, de la más externa a la actual. Vacío = raíz del sistema. */
  protected readonly pila = signal<SidebarNavRuta[]>([]);
  protected readonly busqueda = signal('');
  protected readonly vista = signal<'cuadricula' | 'lista'>('cuadricula');

  constructor() {
    // Cambiar de sistema vuelve a la raíz: la pila del anterior no aplica.
    effect(() => {
      this.panel();
      this.pila.set([]);
      this.busqueda.set('');
    });
  }

  /** Contenido de la carpeta actual, ya filtrado por permisos. */
  protected readonly nodosActuales = computed<SidebarNavRuta[]>(() => {
    const pila = this.pila();
    if (pila.length === 0) return this.navegacion.nodosRaiz();
    return this.navegacion.filtrarVisibles(pila[pila.length - 1].hijos ?? []);
  });

  /** Lo que se ve: carpetas primero y, dentro de cada grupo, orden alfabético — como el explorador de Windows. */
  protected readonly nodosVisibles = computed<SidebarNavRuta[]>(() => {
    const termino = this.normalizar(this.busqueda().trim());
    const nodos = termino
      ? this.nodosActuales().filter((n) => this.normalizar(n.etiqueta).includes(termino))
      : this.nodosActuales();

    return [...nodos].sort((a, b) => {
      const carpetaA = this.esCarpeta(a) ? 0 : 1;
      const carpetaB = this.esCarpeta(b) ? 0 : 1;
      if (carpetaA !== carpetaB) return carpetaA - carpetaB;
      return a.etiqueta.localeCompare(b.etiqueta, 'es');
    });
  });

  protected readonly migas = computed<MigaExplorador[]>(() => [
    { etiqueta: this.panel()?.titulo ?? 'Inicio', indice: -1 },
    ...this.pila().map((carpeta, i) => ({ etiqueta: carpeta.etiqueta, indice: i })),
  ]);

  protected readonly puedeSubir = computed(() => this.pila().length > 0);

  protected readonly hayBusquedaSinResultados = computed(
    () => this.busqueda().trim().length > 0 && this.nodosVisibles().length === 0
  );

  protected esCarpeta(nodo: SidebarNavRuta): boolean {
    return (nodo.hijos?.length ?? 0) > 0;
  }

  /** Entra a la carpeta, o abre la pantalla si el nodo es una hoja. */
  protected abrir(nodo: SidebarNavRuta): void {
    if (this.esCarpeta(nodo)) {
      this.pila.update((p) => [...p, nodo]);
      this.busqueda.set('');
      return;
    }
    if (!nodo.ruta) return;

    this.shell.setMenuItemActivo({ ruta: nodo.ruta, etiqueta: nodo.etiqueta });
    this.shell.setContenidoPendienteSeleccion(false);
    this.router.navigateByUrl(nodo.ruta).catch((err) => {
      console.warn(`Ruta no encontrada: ${nodo.ruta}`, err);
    });
  }

  /** Vuelve al nivel de la miga; `-1` es la raíz del sistema. */
  protected irAMiga(indice: number): void {
    this.pila.update((p) => p.slice(0, indice + 1));
    this.busqueda.set('');
  }

  protected subirNivel(): void {
    if (!this.puedeSubir()) return;
    this.pila.update((p) => p.slice(0, -1));
    this.busqueda.set('');
  }

  protected onBusqueda(evento: Event): void {
    this.busqueda.set((evento.target as HTMLInputElement).value);
  }

  protected limpiarBusqueda(): void {
    this.busqueda.set('');
  }

  protected cambiarVista(vista: 'cuadricula' | 'lista'): void {
    this.vista.set(vista);
  }

  /** Compara sin acentos ni mayúsculas, para que "categorizacion" encuentre "Categorización". */
  private normalizar(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();
  }
}
