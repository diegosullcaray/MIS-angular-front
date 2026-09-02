import { Component, inject, signal, computed } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

// Iconos
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideChevronDown, lucideSettings,
  lucideLogOut, lucideBell, lucideSearch, lucideAlertTriangle,
  lucideUsers, lucideSun, lucideMoon, lucideMenu, lucideMegaphone
} from '@ng-icons/lucide';

// PrimeNG
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import type { MenuItem } from 'primeng/api';

// Servicios y Componentes
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { ThemeService } from '../../../../../shared/services/theme.service';
import { PreferenciasService } from '../../../../../core/preferencias/aplicacion/preferencias.service';
import { AnunciosService } from '../../../../../core/preferencias/aplicacion/anuncios.service';
import { AuthService } from '../../../auth/service/auth.service';
import type { AlternateUsuario } from '../../../auth/model/auth-session.model';
import { ToastService } from '../../../../../shared/services/toast.service';
import { MenuStgService } from '../../services/menu-stg.service';
import { NavegacionSistemasService } from '../../services/navegacion-sistemas.service';
import { KaypachaService } from '../../../../modules/ranking-k/services/kaypacha.service';
import { ConfiguracionDialogComponent } from '../dialogs/configuracion-dialog/configuracion-dialog.component';
import { SEGMENTO_LABELS } from '../../interfaces/navigation.constants';



/** Fila de la lista "Otros perfiles": un alterno, o la identidad propia cuando ya se está viendo como otro. */
interface PerfilDelMenu {
  clave: string;
  nombre: string;
  detalle?: string;
  /** `true` cuando la fila devuelve a la identidad propia (no llama al backend). */
  esOriginal: boolean;
  alterno?: AlternateUsuario;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgIconComponent, BreadcrumbModule, DialogModule, ButtonModule, ConfiguracionDialogComponent],
  viewProviders: [
    provideIcons({
      lucideChevronDown, lucideSettings,
      lucideLogOut, lucideBell, lucideSearch, lucideAlertTriangle,
      lucideUsers, lucideSun, lucideMoon, lucideMenu, lucideMegaphone
    })
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  // ─── Dependencias ──────────────────────────────────────────────────────────
  protected readonly shell = inject(ShellStateService);
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  protected readonly anuncios = inject(AnunciosService);
  private readonly toast = inject(ToastService);
  private readonly preferencias = inject(PreferenciasService);
  private readonly router = inject(Router);
  private readonly menuStg = inject(MenuStgService);
  private readonly navegacion = inject(NavegacionSistemasService);
  private readonly kaypacha = inject(KaypachaService);

  // ─── Estado Local (Signals) ───────────────────────────────────────────────
  protected readonly dropdownOpen = signal(false);
  protected readonly confirmarSalirOpen = signal(false);
  protected readonly configuracionOpen = signal(false);
  /** Email del perfil que se está activando (null = ninguno en curso). */
  protected readonly cambiandoPerfil = signal<string | null>(null);

  /** URL actual capturada para reaccionar a cambios de ruta. */
  private readonly urlActual = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  // ─── Estado Computado ─────────────────────────────────────────────────────

  /** Determina si el sidebar está en modo superpuesto. */
  protected readonly menuSuperpuesto = computed(
    () => this.preferencias.estructura().modoSidebar === 'superpuesto',
  );

  /**
   * Los perfiles a los que se puede saltar con un clic. Viendo como un alterno
   * la lista es la identidad propia —el camino de vuelta, en el mismo lugar
   * que el resto de los perfiles, como hace Chrome— y si no, los alternos
   * asignados.
   */
  protected readonly otrosPerfiles = computed<PerfilDelMenu[]>(() => {
    const original = this.auth.usuarioOriginal();
    if (original) {
      return [{ clave: original.email, nombre: original.nombre, detalle: original.email, esOriginal: true }];
    }

    if (!this.auth.puedeCambiarUsuario()) return [];

    return this.auth.alternates().map((alterno) => ({
      clave: alterno.email,
      nombre: alterno.nombre,
      detalle: alterno.cargo,
      esOriginal: false,
      alterno,
    }));
  });

  protected readonly rolLabel = computed(() => {
    const roles: Record<string, string> = {
      'admin-sistema': 'Admin Sistema',
      'admin-general': 'Admin General',
      'supervisor-area': 'Supervisor',
    };
    return roles[this.shell.usuarioActivo()?.rol ?? ''] ?? '';
  });

  // ─── Configuración de Breadcrumb ──────────────────────────────────────────
  protected readonly breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };

  /** Breadcrumb dinámico según la ruta activa o el explorador. */
  protected readonly breadcrumbItems = computed<MenuItem[]>(() => {
    if (this.shell.contenidoPendienteSeleccion()) return this.breadcrumbExplorador();

    const url = this.urlActual().split('?')[0].split('#')[0];
    const segmentos = url.split('/').filter(Boolean);

    // Ignora rutas que no sean del shell principal (/app/...)
    if (segmentos[0] !== 'app' || segmentos.length < 2) return [];

    const resto = segmentos.slice(1);
    const esRemote = !(resto[0] in SEGMENTO_LABELS);

    return esRemote ? this.breadcrumbRemote(resto, url) : this.breadcrumbHost(resto);
  });

  // ─── Acciones de la Vista ─────────────────────────────────────────────────
  protected toggleDropdown(): void {
    this.dropdownOpen.update(v => !v);
  }

  protected alternarRail(): void {
    this.shell.setRailSuperpuestoAbierto(!this.shell.railSuperpuestoAbierto());
  }

  protected pedirConfirmacionSalir(): void {
    this.cerrarDropdownYAbrir(this.confirmarSalirOpen);
  }

  /** Un clic en una fila de "Otros perfiles": volver a la identidad propia o saltar a un alterno. */
  protected async elegirPerfil(perfil: PerfilDelMenu): Promise<void> {
    if (perfil.esOriginal) {
      this.volverAUsuarioOriginal();
      return;
    }
    await this.cambiarAPerfil(perfil.alterno!);
  }

  /**
   * Cambia de perfil con un solo clic, como el selector de cuentas de Chrome:
   * sin diálogo de por medio. El menú queda abierto mientras dura el cambio
   * —con la fila marcada— y recién se cierra cuando la sesión ya es la otra.
   */
  protected async cambiarAPerfil(alterno: AlternateUsuario): Promise<void> {
    if (this.cambiandoPerfil()) return;

    this.cambiandoPerfil.set(alterno.email);
    try {
      await this.auth.cambiarAUsuarioAlterno(alterno);
      this.dropdownOpen.set(false);
    } catch (err: any) {
      this.toast.error('No se pudo cambiar de perfil', err?.message);
    } finally {
      this.cambiandoPerfil.set(null);
    }
  }

  /** Iniciales del avatar de un perfil alterno (el del activo lo da el shell). */
  protected inicialesDe(nombre: string): string {
    return nombre
      .split(' ')
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }

  protected abrirConfiguracion(): void {
    this.cerrarDropdownYAbrir(this.configuracionOpen);
  }

  /** Alterna el tema claro/oscuro. */
  protected alternarTema(): void {
    this.preferencias.alternarTema();
  }

  protected volverAUsuarioOriginal(): void {
    this.dropdownOpen.set(false);
    this.auth.volverAUsuarioOriginal();
  }

  protected async confirmarCerrarSesion(): Promise<void> {
    this.confirmarSalirOpen.set(false);
    // El overlay de carga (spinner) se maneja a nivel raíz para evitar problemas de z-index
    this.shell.setCerrandoSesion(true);
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await this.auth.cerrarSesion();
  }

  // ─── Métodos Privados ─────────────────────────────────────────────────────

  /** Cierra el dropdown y abre un dialog. */
  private cerrarDropdownYAbrir(modalSignal: typeof this.confirmarSalirOpen): void {
    this.dropdownOpen.set(false);
    modalSignal.set(true);
  }

  /** Ubicación dentro del explorador; cada miga vuelve a su nivel. */
  private breadcrumbExplorador(): MenuItem[] {
    const panel = this.navegacion.panelActivo();
    if (!panel) return [];

    return [
      { label: panel.titulo, command: () => this.navegacion.irANivel(-1) },
      ...this.navegacion.rutaExplorador().map((carpeta, i) => ({
        label: carpeta.etiqueta,
        command: () => this.navegacion.irANivel(i),
      })),
    ];
  }

  /** Genera el breadcrumb mapeando los segmentos nativos. */
  private breadcrumbHost(resto: string[]): MenuItem[] {
    let rutaAcumulada = '/app';

    return resto.map((seg, index) => {
      rutaAcumulada += `/${seg}`;
      let label = SEGMENTO_LABELS[seg];

      // Excepción: Búsqueda dinámica de nombre de categoría para Kaypacha
      if (!label && resto[index - 1] === 'categoria') {
        label = this.kaypacha.buscarCategoria(seg)?.name ?? 'Detalle';
      }

      label = label || 'Detalle';
      const esUltimo = index === resto.length - 1;

      return esUltimo ? { label } : { label, routerLink: rutaAcumulada };
    });
  }

  /** Breadcrumb para rutas de sistemas remotos (STG). */
  private breadcrumbRemote(resto: string[], url: string): MenuItem[] {
    const hallazgo = this.menuStg.buscarPorRuta(url);

    if (hallazgo) {
      const carpetas = hallazgo.nodos.slice(0, -1);
      return [
        { label: this.labelDeRemote(hallazgo.sistemaId), command: () => this.navegacion.abrirEnCarpeta(hallazgo.sistemaId, []) },
        ...carpetas.map((nodo, i) => ({
          label: nodo.etiqueta,
          command: () => this.navegacion.abrirEnCarpeta(hallazgo.sistemaId, carpetas.slice(0, i + 1)),
        })),
        { label: hallazgo.nodos[hallazgo.nodos.length - 1].etiqueta },
      ];
    }

    // Fallback: Muestra el último segmento limpio si el árbol aún no cargó.
    const items: MenuItem[] = [{ label: this.labelDeRemote(resto[0]) }];
    if (resto.length > 1) {
      items.push({ label: this.prettify(resto[resto.length - 1]) });
    }
    return items;
  }

  private labelDeRemote(slug: string): string {
    const stg = this.menuStg.sistemas().find(s => s.id === slug);
    return stg?.etiqueta ?? this.prettify(slug.replace('subsistema-', ''));
  }

  /** Convierte formato URL a texto legible (ej: 'cartera-credito' -> 'Cartera credito'). */
  private prettify(seg: string): string {
    const texto = seg.replace(/-/g, ' ');
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }
}
