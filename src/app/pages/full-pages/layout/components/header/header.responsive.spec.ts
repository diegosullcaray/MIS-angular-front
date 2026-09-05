import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Component, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { HeaderComponent } from './header.component';
import { AuthService } from '../../../auth/service/auth.service';
import { MenuStgService } from '../../services/menu-stg.service';
import { NavegacionSistemasService } from '../../services/navegacion-sistemas.service';
import { KaypachaService } from '../../../../modules/ranking-k/services/kaypacha.service';
import type { SidebarIcon, SidebarNavPanelConfig, SidebarNavRuta } from '../../interfaces/sidebar.model';

@Component({ selector: 'app-blank', standalone: true, template: '' })
class BlankComponent {}

/**
 * Contrato responsive del header.
 *
 * jsdom no calcula layout, así que acá NO se mide un tamaño: se verifica que las
 * clases que producen ese tamaño sigan declaradas. Es la red barata que atrapa
 * la regresión —alguien vuelve a poner `w-8` y el botón queda en 32px— sin
 * levantar un navegador. La medición real, en píxeles y en dispositivos, está en
 * `e2e/responsive-movil.spec.ts`.
 */
describe('HeaderComponent — contrato responsive', () => {
  /**
   * El header arrastra media aplicación por inyección (sesión, menú STG,
   * navegación, ranking). Nada de eso interviene en el tamaño de los botones,
   * así que se dobla igual que en `header.component.spec.ts`: lo que se mira es
   * el HTML que sale, no de dónde salen sus datos.
   */
  function crear(): HTMLElement {
    TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([{ path: '**', component: BlankComponent }]),
        {
          provide: AuthService,
          useValue: {
            cerrarSesion: vi.fn(),
            esUsuarioAlterno: vi.fn().mockReturnValue(false),
            puedeCambiarUsuario: vi.fn().mockReturnValue(false),
            usuarioOriginal: vi.fn().mockReturnValue(null),
            alternates: vi.fn().mockReturnValue([]),
            cambiarAUsuarioAlterno: vi.fn().mockResolvedValue(undefined),
            volverAUsuarioOriginal: vi.fn(),
          },
        },
        {
          provide: MenuStgService,
          useValue: { sistemas: signal<SidebarIcon[]>([]), buscarPorRuta: vi.fn().mockReturnValue(null) },
        },
        { provide: KaypachaService, useValue: { buscarCategoria: vi.fn().mockReturnValue(undefined) } },
        {
          provide: NavegacionSistemasService,
          useValue: {
            panelActivo: signal<SidebarNavPanelConfig | null>(null),
            rutaExplorador: signal<SidebarNavRuta[]>([]),
            abrirEnCarpeta: vi.fn(),
            irANivel: vi.fn(),
          },
        },
        MessageService,
      ],
    });
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    localStorage.clear();
    window.matchMedia = ((consulta: string) => ({
      matches: false,
      media: consulta,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
  });

  afterEach(() => localStorage.clear());

  /**
   * En píxeles explícitos y no en `w-11`: el rem del proyecto está escalado y
   * `w-11` (2.75rem) daba 41px, por debajo del mínimo.
   */
  it('los botones de acción declaran 44px en móvil y densidad de escritorio desde sm', () => {
    const el = crear();
    const acciones = Array.from(el.querySelectorAll('button')).filter((b) =>
      /Comunicados|modo claro|modo oscuro/i.test(b.getAttribute('aria-label') ?? ''),
    );

    expect(acciones.length).toBeGreaterThanOrEqual(2);
    for (const boton of acciones) {
      expect(boton.className, boton.getAttribute('aria-label') ?? '').toContain('w-[44px]');
      expect(boton.className, boton.getAttribute('aria-label') ?? '').toContain('h-[44px]');
      // La densidad de escritorio no cambia: 32px desde el breakpoint `sm`.
      expect(boton.className).toContain('sm:w-8');
      expect(boton.className).toContain('sm:h-8');
    }
  });

  it('la píldora de usuario reserva el alto táctil en móvil', () => {
    const el = crear();
    const pill = el.querySelector('[role="button"][aria-haspopup="true"]') as HTMLElement;

    expect(pill).not.toBeNull();
    expect(pill.className).toContain('min-h-[44px]');
    expect(pill.className).toContain('sm:min-h-0');
  });

  it('el botón del rail superpuesto solo existe desde sm, donde el rail se ancla', () => {
    // En móvil el rail ES la barra inferior y está siempre a la vista: un botón
    // para abrirlo sobraría y se comería 44px del header.
    const el = crear();
    const alternar = Array.from(el.querySelectorAll('button')).find((b) =>
      /menú de sistemas/i.test(b.getAttribute('aria-label') ?? ''),
    );
    if (alternar) expect(alternar.className).toContain('hidden sm:flex');
  });
});
