import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { SistemasService } from '../../../../modules/admin/sistemas/services/sistemas.service';
import { SidebarNavPanelComponent } from '../sidebar-nav-panel/sidebar-nav-panel.component';
import { TooltipModule } from 'primeng/tooltip';
import { MenuStgService } from '../../services/menu-stg.service';
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
  private readonly sistemasService = inject(SistemasService);
  private readonly menuStg = inject(MenuStgService);
  private readonly router = inject(Router);
  protected readonly isNavPanelCollapsed = signal<boolean>(false);

  constructor() {
    // El registro de sistemas alimenta etiquetas e íconos de los remotes
    this.sistemasService.cargarSistemas();
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
    ];

    const sistemasStg = this.menuStg.sistemas();
    const idsStg = new Set(sistemasStg.map(s => s.id));

    // Remotes registrados en /api/v1/sistemas que todavía no vinieron por STG
    // (evita duplicar un mismo sistema si aparece en ambas fuentes).
    const remotesRegistrados: SidebarIcon[] = this.shell.subsistemas()
      .filter(slug => !idsStg.has(slug))
      .map(slug => ({
        id:         slug,
        tipo:       'remote' as const,
        icono:      this.getRemoteIcono(slug),
        etiqueta:   this.getRemoteLabel(slug),
        tienePanel: true,
      }));

    return [...base, ...sistemasStg, ...remotesRegistrados];
  });

  protected readonly panelActivo = computed<SidebarNavPanelConfig | null>(() => {
    const id = this.shell.sidebarIconActivo();

    if (id === 'host-inicio') {
      return this.getPanelHost();
    }

    return this.getPanelRemote(id);
  });

  protected seleccionarIcono(icon: SidebarIcon): void {
    if (!icon.tienePanel && icon.ruta) {
      this.router.navigateByUrl(icon.ruta);
      return;
    }
    this.shell.setSidebarIconActivo(icon.id);
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
          { etiqueta: 'Ayuda', ruta: '/admin/help', icono: 'lucideHelpCircle' },
        ],
      },
      {
        titulo: 'Accesos [Admin]',
        rutas: [
          { etiqueta: 'Gestión de usuarios', ruta: '/admin/usuarios', icono: 'lucideUsers',    soloAdminSistema: true },
          { etiqueta: 'Gestión de roles',    ruta: '/admin/roles',    icono: 'lucideActivity', soloAdminSistema: true },
          { etiqueta: 'Gestión de sistemas', ruta: '/admin/sistemas', icono: 'lucideBoxes',    soloAdminSistema: true },
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

  private getPanelRemote(slug: string): SidebarNavPanelConfig {
    const hijosStg = this.menuStg.hijosPorSistema()[slug];

    // Sistema de STG con nodos de segundo nivel reales (list_sec) — se
    // muestran tal cual los trae el backend, en vez del stub genérico.
    const secciones: SidebarNavSeccion[] = hijosStg
      ? [{ titulo: this.getRemoteLabel(slug), rutas: hijosStg }]
      : [
          {
            titulo: 'Acceso directo',
            rutas: [
              { etiqueta: 'Dashboard', ruta: `/admin/${slug}/dashboard`, icono: 'lucideGrid' },
            ],
          },
          {
            titulo: this.getRemoteLabel(slug),
            rutas: [
              { etiqueta: 'Módulo principal', ruta: `/admin/${slug}`, icono: 'lucideActivity' },
            ],
          },
        ];

    return {
      tipo:   'remote',
      titulo: this.getRemoteLabel(slug),
      icono:  this.getRemoteIcono(slug),
      secciones,
    };
  }

  private getRemoteLabel(slug: string): string {
    const stg = this.menuStg.sistemas().find(s => s.id === slug);
    if (stg) return stg.etiqueta;

    const sistema = this.sistemasService.sistemas().find(s => s.slug === slug);
    return sistema?.nombre ?? slug.replace('subsistema-', '');
  }

  private getRemoteIcono(slug: string): string {
    const stg = this.menuStg.sistemas().find(s => s.id === slug);
    if (stg) return stg.icono;

    const sistema = this.sistemasService.sistemas().find(s => s.slug === slug);
    return sistema?.icono ?? 'pi pi-th-large';
  }
}
