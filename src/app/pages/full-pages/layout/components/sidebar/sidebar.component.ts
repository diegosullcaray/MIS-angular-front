import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { SistemasService } from '../../../../modules/admin/sistemas/services/sistemas.service';
import { SidebarNavPanelComponent } from '../sidebar-nav-panel/sidebar-nav-panel.component';
import { ModSysAdminService } from '../../../../../core/winder/instances/mod-sys-admin.service';
import type { SidebarIcon, SidebarNavPanelConfig, SidebarNavRuta, SidebarNavSeccion } from '../../interfaces/sidebar.model';

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

  // Señal para almacenar las rutas de primer nivel provenientes de STG
  private readonly stgMenuRoutes = signal<SidebarNavRuta[]>([]);

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
        const body = response.body as any;
        // Asumiendo que la respuesta es un array o contiene un array "data"
        const items: any[] = Array.isArray(body) ? body : (body?.data || body?.items || []);
        
        // Filtramos solo los nodos de primer nivel (donde parent es null, 0 o nivel 1 dependiendo del backend)
        const primerNivel = items.filter(item => !item.parent_id || item.parent_id === '0' || item.nivel === 1);
        
        const rutasStg: SidebarNavRuta[] = primerNivel.map(item => ({
          etiqueta: item.name || item.sec_name || item.titulo || 'Menú STG',
          ruta: item.url || item.sec_url || '/admin/stg-route',
          icono: item.icon || item.sec_icon || 'lucideFolder'
        }));
        
        this.stgMenuRoutes.set(rutasStg);
      },
      error: (err) => {
        console.error('Error al cargar menú STG:', err);
      }
    });
  }

  protected toggleNavPanel(): void {
    this.isNavPanelCollapsed.update(collapsed => !collapsed);
  }

  protected readonly iconActivoId = this.shell.sidebarIconActivo;

  protected readonly iconos = computed<SidebarIcon[]>(() => {
    const remotes = this.shell.subsistemas();

    const base: SidebarIcon[] = [
      {
        id: 'host-inicio',
        tipo: 'host-inicio',
        icono: 'pi pi-home',
        etiqueta: 'Inicio',
        tienePanel: true,
      },
    ];

    const remotesIconos: SidebarIcon[] = remotes.map(slug => ({
      id:         slug,
      tipo:       'remote' as const,
      icono:      this.getRemoteIcono(slug),
      etiqueta:   this.getRemoteLabel(slug),
      tienePanel: true,
    }));

    return [...base, ...remotesIconos];
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
    const stgRoutes = this.stgMenuRoutes();
    const secciones: SidebarNavSeccion[] = [
      {
        titulo: 'Acceso directo',
        rutas: [
          { etiqueta: 'Mi espacio', ruta: '/admin/dashboard', icono: 'lucideGrid' },
          { etiqueta: 'Ayuda', ruta: '/admin/help', icono: 'lucideHelpCircle' },
        ],
      }
    ];

    if (stgRoutes.length > 0) {
      secciones.push({
        titulo: 'Menú Principal (STG)',
        rutas: stgRoutes
      });
    }

    secciones.push({
      titulo: 'Accesos [Admin]',
      rutas: [
        { etiqueta: 'Gestión de usuarios', ruta: '/admin/usuarios', icono: 'lucideUsers',    soloAdminSistema: true },
        { etiqueta: 'Gestión de roles',    ruta: '/admin/roles',    icono: 'lucideActivity', soloAdminSistema: true },
        { etiqueta: 'Gestión de sistemas', ruta: '/admin/sistemas', icono: 'lucideBoxes',    soloAdminSistema: true },
      ],
    });

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
    const sistema = this.sistemasService.sistemas().find(s => s.slug === slug);
    return sistema?.nombre ?? slug.replace('subsistema-', '');
  }

  private getRemoteIcono(slug: string): string {
    const sistema = this.sistemasService.sistemas().find(s => s.slug === slug);
    return sistema?.icono ?? 'pi pi-th-large';
  }
}
