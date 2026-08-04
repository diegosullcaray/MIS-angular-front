import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { SidebarNavPanelComponent } from '../sidebar-nav-panel/sidebar-nav-panel.component';
import { TooltipModule } from 'primeng/tooltip';
import { MenuStgService } from '../../services/menu-stg.service';
import { KaypachaService } from '../../../../modules/kaypacha/services/kaypacha.service';
import type { SidebarIcon, SidebarNavPanelConfig, SidebarNavSeccion } from '../../interfaces/sidebar.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [SidebarNavPanelComponent, TooltipModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent implements OnInit {
  protected readonly shell = inject(ShellStateService);
  private readonly menuStg = inject(MenuStgService);
  private readonly kaypacha = inject(KaypachaService);
  private readonly router = inject(Router);
  protected readonly isNavPanelCollapsed = signal<boolean>(false);

  constructor() {
    // Categorías del ranking, para la sección "Categoría" del panel de Kaypacha.
    this.kaypacha.cargarCategorias();
  }

  ngOnInit() {
    const usuario = this.shell.usuarioActivo();
    if (usuario?.email) {
      this.menuStg.cargar(usuario.email);
    }
  }

  protected toggleNavPanel(): void {
    this.isNavPanelCollapsed.update(collapsed => !collapsed);
  }

  protected readonly iconActivoId = this.shell.sidebarIconActivo;

  protected readonly iconos = computed<SidebarIcon[]>(() => {
    const base: SidebarIcon[] = [
      {
        id: 'host-inicio',
        tipo: 'host-inicio',
        icono: 'pi pi-home',
        etiqueta: 'Inicio',
        tienePanel: true,
      },
      {
        id: 'kaypacha',
        tipo: 'host-modulo',
        icono: 'pi pi-trophy',
        etiqueta: 'Kaypacha',
        tienePanel: true,
      },
    ];

    // Sistemas de STG (backend Ant) que todavía no se migraron a un módulo
    // propio del Host — mientras eso pasa, siguen apareciendo aquí igual
    // que antes (MenuStgService), aunque su navegación puede no resolver
    // hasta que se migren (ver HU de migración incremental).
    const sistemasStg = this.menuStg.sistemas();

    return [...base, ...sistemasStg];
  });

  /** `null` cuando el sistema activo no tiene panel — Col 2 se oculta por completo (ver template). */
  protected readonly panelActivo = computed<SidebarNavPanelConfig | null>(() => {
    const id = this.shell.sidebarIconActivo();

    if (id === 'host-inicio') {
      return this.getPanelHost();
    }

    if (id === 'kaypacha') {
      return this.getPanelKaypacha();
    }

    const icono = this.iconos().find(i => i.id === id);
    if (!icono?.tienePanel) return null;

    return this.getPanelStg(id);
  });

  protected seleccionarIcono(icon: SidebarIcon): void {
    // Siempre se marca activo el ícono clickeado, tenga panel o no: así Col 1
    // resalta el sistema correcto y `panelActivo` oculta Col 2 si no aplica.
    this.shell.setSidebarIconActivo(icon.id);

    if (!icon.tienePanel && icon.ruta) {
      this.router.navigateByUrl(icon.ruta);
    }
  }

  protected onRutaSeleccionada(ruta: string): void {
    this.shell.setMenuItemActivo({ ruta, etiqueta: ruta.split('/').pop() ?? '' });
  }

  private getPanelHost(): SidebarNavPanelConfig {
    const secciones: SidebarNavSeccion[] = [
      {
        titulo: 'Acceso directo',
        rutas: [
          { etiqueta: 'Mi espacio', ruta: '/admin/dashboard', icono: 'lucideGrid' },
        ],
      },
    ];

    return {
      tipo:   'host-admin',
      titulo: 'Host Principal',
      icono:  'pi pi-home',
      secciones: secciones
    };
  }

  /** Panel de Kaypacha — Col 2 empieza con la sección "Categoría" (datos del ranking). */
  private getPanelKaypacha(): SidebarNavPanelConfig {
    const secciones: SidebarNavSeccion[] = [
      {
        titulo: 'Categoría',
        rutas: this.kaypacha.categorias().map(categoria => ({
          etiqueta: categoria.name,
          ruta: `/admin/kaypacha/categoria/${categoria.rdestip}`,
        })),
      },
    ];

    return {
      tipo:   'host-admin',
      titulo: 'Kaypacha',
      icono:  'pi pi-trophy',
      secciones,
    };
  }

  /**
   * Solo se llama para sistemas con `tienePanel: true` que vienen de STG
   * (list_sec), es decir, todavía no migrados a un módulo propio del Host.
   */
  private getPanelStg(slug: string): SidebarNavPanelConfig {
    const hijosStg = this.menuStg.hijosPorSistema()[slug] ?? [];
    const stg = this.menuStg.sistemas().find(s => s.id === slug);
    const titulo = stg?.etiqueta ?? slug;
    const secciones: SidebarNavSeccion[] = [{ titulo, rutas: hijosStg }];

    return {
      tipo:   'remote',
      titulo,
      icono:  stg?.icono ?? 'pi pi-th-large',
      secciones,
    };
  }
}
