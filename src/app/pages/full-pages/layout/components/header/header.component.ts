import {
  afterNextRender,
  Component,
  computed,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideChevronDown,
  lucideSettings,
  lucideLogOut,
  lucideSearch,
  lucideAlertTriangle,
  lucideUsers,
  lucideSun,
  lucideMoon,
  lucideMenu,
  lucideMegaphone,
  lucideX,
} from '@ng-icons/lucide';

import { BreadcrumbModule } from 'primeng/breadcrumb';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import type { MenuItem } from 'primeng/api';

import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { ThemeService } from '../../../../../shared/services/theme.service';
import { PreferenciasService } from '../../services/preferencias.service';
import { AnunciosService } from '../../services/anuncios.service';
import { AuthService } from '../../../auth/service/auth.service';
import type { AlternateUsuario } from '../../../auth/model/auth-session.model';
import { ToastService } from '../../../../../shared/services/toast.service';
import { MenuStgService } from '../../services/menu-stg.service';
import { NavegacionSistemasService } from '../../services/navegacion-sistemas.service';
import { KaypachaService } from '../../../../modules/ranking-k/services/kaypacha.service';
import { ConfiguracionDialogComponent } from '../dialogs/configuracion-dialog/configuracion-dialog.component';
import { SEGMENTO_LABELS } from '../../interfaces/navigation.constants';
import { BuscadorComponent } from '../../../../../shared/ui/buscador/buscador.component';
interface PerfilDelMenu {
  clave: string;
  nombre: string;
  detalle?: string;
  esOriginal: boolean;
  alterno?: AlternateUsuario;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    NgIconComponent,
    BreadcrumbModule,
    DialogModule,
    ButtonModule,
    ConfiguracionDialogComponent,
    BuscadorComponent,
  ],
  viewProviders: [
    provideIcons({
      lucideChevronDown,
      lucideSettings,
      lucideLogOut,
      lucideSearch,
      lucideAlertTriangle,
      lucideUsers,
      lucideSun,
      lucideMoon,
      lucideMenu,
      lucideMegaphone,
      lucideX,
    }),
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
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
  private readonly injector = inject(Injector);
  private readonly buscador = viewChild(BuscadorComponent);

  protected readonly dropdownOpen = signal(false);
  protected readonly confirmarSalirOpen = signal(false);
  protected readonly configuracionOpen = signal(false);
  /** Selector explícito de perfiles, equivalente al diálogo `Escoge Usuario` del legado. */
  protected readonly selectorPerfilOpen = signal(false);
  protected readonly perfilSeleccionado = signal<PerfilDelMenu | null>(null);
  protected readonly buscadorAbierto = signal(false);
  protected readonly cambiandoPerfil = signal<string | null>(null);

  private readonly urlActual = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly menuSuperpuesto = computed(
    () => this.preferencias.estructura().modoSidebar === 'superpuesto',
  );

  protected readonly otrosPerfiles = computed<PerfilDelMenu[]>(() => {
    const original = this.auth.usuarioOriginal();
    if (original) {
      return [
        {
          clave: original.email,
          nombre: original.nombre,
          detalle: original.email,
          esOriginal: true,
        },
      ];
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

  protected readonly breadcrumbHome: MenuItem = {
    icon: 'pi pi-home',
    routerLink: '/app/dashboard',
  };

  protected readonly breadcrumbItems = computed<MenuItem[]>(() => {
    if (this.shell.contenidoPendienteSeleccion()) return this.breadcrumbExplorador();

    const url = this.urlActual().split('?')[0].split('#')[0];
    const segmentos = url.split('/').filter(Boolean);

    if (segmentos[0] !== 'app' || segmentos.length < 2) return [];

    const resto = segmentos.slice(1);
    const esRemote = !(resto[0] in SEGMENTO_LABELS);

    return esRemote ? this.breadcrumbRemote(resto, url) : this.breadcrumbHost(resto);
  });

  protected toggleDropdown(): void {
    this.dropdownOpen.update((v) => !v);
  }

  protected alternarRail(): void {
    this.shell.setRailSuperpuestoAbierto(!this.shell.railSuperpuestoAbierto());
  }

  protected pedirConfirmacionSalir(): void {
    this.cerrarDropdownYAbrir(this.confirmarSalirOpen);
  }

  /** Abre el selector; el menú de cabecera nunca cambia de cuenta directamente. */
  protected abrirSelectorPerfil(): void {
    this.perfilSeleccionado.set(null);
    this.cerrarDropdownYAbrir(this.selectorPerfilOpen);
  }

  protected async confirmarCambioPerfil(): Promise<void> {
    const perfil = this.perfilSeleccionado();
    if (!perfil || this.cambiandoPerfil()) return;

    if (perfil.esOriginal) {
      this.selectorPerfilOpen.set(false);
      this.perfilSeleccionado.set(null);
      this.volverAUsuarioOriginal();
      return;
    }

    await this.cambiarAPerfil(perfil.alterno!);
  }

  protected async cambiarAPerfil(alterno: AlternateUsuario): Promise<void> {
    if (this.cambiandoPerfil()) return;

    this.cambiandoPerfil.set(alterno.email);
    try {
      await this.auth.cambiarAUsuarioAlterno(alterno);
      this.dropdownOpen.set(false);
      this.selectorPerfilOpen.set(false);
      this.perfilSeleccionado.set(null);
    } catch (err: any) {
      this.toast.error('No se pudo cambiar de perfil', err?.message);
    } finally {
      this.cambiandoPerfil.set(null);
    }
  }

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

  protected alternarTema(): void {
    this.preferencias.alternarTema();
  }

  protected alternarBuscador(): void {
    const abre = !this.buscadorAbierto();
    this.buscadorAbierto.set(abre);
    if (abre) {
      afterNextRender(() => this.buscador()?.enfocar(), { injector: this.injector });
    }
  }

  protected volverAUsuarioOriginal(): void {
    this.dropdownOpen.set(false);
    this.auth.volverAUsuarioOriginal();
  }

  protected async confirmarCerrarSesion(): Promise<void> {
    this.confirmarSalirOpen.set(false);
    this.shell.setCerrandoSesion(true);
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await this.auth.cerrarSesion();
  }

  private cerrarDropdownYAbrir(modalSignal: typeof this.confirmarSalirOpen): void {
    this.dropdownOpen.set(false);
    modalSignal.set(true);
  }

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
    // Una sección remota puede ser un ícono sin hijos. En ese caso `act_sec`
    // apunta directamente a la pantalla y no aparece en `hijosPorSistema`.
    // Su etiqueta ya es `desc_sec`; nunca usar `cod_sec` como texto visible.
    const seccionDirecta = this.menuStg.sistemas().find((sistema) => sistema.ruta === url);
    if (seccionDirecta) return [{ label: seccionDirecta.etiqueta }];

    const hallazgo = this.menuStg.buscarPorRuta(url);

    if (hallazgo) {
      const carpetas = hallazgo.nodos.slice(0, -1);
      return [
        {
          label: this.labelDeRemote(hallazgo.sistemaId),
          command: () => this.navegacion.abrirEnCarpeta(hallazgo.sistemaId, []),
        },
        ...carpetas.map((nodo, i) => ({
          label: nodo.etiqueta,
          command: () =>
            this.navegacion.abrirEnCarpeta(hallazgo.sistemaId, carpetas.slice(0, i + 1)),
        })),
        { label: hallazgo.nodos[hallazgo.nodos.length - 1].etiqueta },
      ];
    }

    // Fallback: Muestra el último segmento limpio si el árbol aún no cargó.
    const items: MenuItem[] = [{ label: this.labelDeRemote(resto[0]) }];
    if (resto.length > 1) {
      const activo = this.shell.menuItemActivo();
      const etiqueta =
        activo?.ruta === url ? activo.etiqueta : this.prettify(resto[resto.length - 1]);
      items.push({ label: etiqueta });
    }
    return items;
  }

  private labelDeRemote(slug: string): string {
    const stg = this.menuStg.sistemas().find((s) => s.id === slug);
    return stg?.etiqueta ?? this.prettify(slug.replace('subsistema-', ''));
  }

  /** Convierte formato URL a texto legible (ej: 'cartera-credito' -> 'Cartera credito'). */
  private prettify(seg: string): string {
    const texto = seg.replace(/-/g, ' ');
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }
}
