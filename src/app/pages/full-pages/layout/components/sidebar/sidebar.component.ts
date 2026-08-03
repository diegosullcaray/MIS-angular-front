import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { SistemasService } from '../../../../modules/admin/sistemas/services/sistemas.service';
import { SidebarNavPanelComponent } from '../sidebar-nav-panel/sidebar-nav-panel.component';
import { ModSysAdminService } from '../../../../../core/winder/instances/mod-sys-admin.service';
import type { SidebarIcon, SidebarNavPanelConfig, SidebarNavSeccion } from '../../interfaces/sidebar.model';

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

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [SidebarNavPanelComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent implements OnInit {
  protected readonly shell = inject(ShellStateService);
  private readonly sistemasService = inject(SistemasService);
  private readonly modSysAdminService = inject(ModSysAdminService);
  protected readonly isNavPanelCollapsed = signal<boolean>(false);

  // Sistemas de primer nivel del backend Ant (STG) — mismos datos que STG
  // muestra en el module-switcher de su header, ahora como íconos del
  // sidebar lateral azul (Col 1).
  private readonly sistemasStg = signal<SidebarIcon[]>([]);

  constructor() {
    // El registro de sistemas alimenta etiquetas e íconos de los remotes
    this.sistemasService.cargarSistemas();
  }

  ngOnInit() {
    this.cargarMenuStg();
  }

  private cargarMenuStg(): void {
    const usuario = this.shell.usuarioActivo();
    if (!usuario?.email) return;

    this.modSysAdminService.getMenuItems(usuario.email).subscribe({
      next: (response) => {
        const body = response.body as { menu_response?: AntMenuItem[] } | null;
        const items = body?.menu_response ?? [];

        const sistemas: SidebarIcon[] = items
          .filter((item) => !item.cod_par)
          .sort((a, b) => (a.order_sec ?? 0) - (b.order_sec ?? 0))
          .map((item) => ({
            id: this.remoteSlug(item),
            tipo: 'remote' as const,
            // STG usa nombres de Material Icons (icon_sec); no hay mapeo 1:1
            // a PrimeIcons/Lucide, así que se usa el mismo ícono genérico
            // que el resto de los remotes sin ícono propio (getRemoteIcono).
            icono: 'pi pi-th-large',
            etiqueta: item.desc_sec,
            tienePanel: true,
          }));

        this.sistemasStg.set(sistemas);
      },
      error: (err) => {
        console.error('Error al cargar el menú de sistemas (STG):', err);
      },
    });
  }

  /**
   * El slug usado como `:remoteName` del router de microfrontends del Host
   * es el primer segmento de la ruta que entrega el backend (`act_sec`) —
   * así el sistema hijo, cuando esté federado, coincide exactamente con la
   * ruta que trae Ant.
   */
  private remoteSlug(item: AntMenuItem): string {
    const ruta = (item.act_sec ?? item.cod_sec ?? '').replace(/^\/+/, '');
    return ruta.split('/')[0] || item.cod_sec;
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

    const sistemasStg = this.sistemasStg();
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
      icono:  'lucideHome',
      secciones: secciones
    };
  }

  private getPanelRemote(slug: string): SidebarNavPanelConfig {
    return {
      tipo:   'remote',
      titulo: this.getRemoteLabel(slug),
      icono:  this.getRemoteIcono(slug),
      secciones: [
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
      ],
    };
  }

  private getRemoteLabel(slug: string): string {
    const stg = this.sistemasStg().find(s => s.id === slug);
    if (stg) return stg.etiqueta;

    const sistema = this.sistemasService.sistemas().find(s => s.slug === slug);
    return sistema?.nombre ?? slug.replace('subsistema-', '');
  }

  private getRemoteIcono(slug: string): string {
    const stg = this.sistemasStg().find(s => s.id === slug);
    if (stg) return stg.icono;

    const sistema = this.sistemasService.sistemas().find(s => s.slug === slug);
    return sistema?.icono ?? 'pi pi-th-large';
  }
}
