import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { InicioComponent } from './inicio.component';
import { PreferenciasService } from '../../../../full-pages/layout/services/preferencias.service';
import { REPOSITORIO_PREFERENCIAS } from '../../../../full-pages/layout/interfaces/preferencias-almacen.model';
import { PreferenciasLocalStorageRepositorio } from '../../../../full-pages/layout/services/preferencias-local-storage.service';

const MINUTO = 60_000;
const HORA = 60 * MINUTO;
const DIA = 24 * HORA;

describe('InicioComponent', () => {
  let preferencias: PreferenciasService;

  beforeEach(() => {
    localStorage.clear();
    window.matchMedia = ((consulta: string) => ({
      matches: false,
      media: consulta,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;

    TestBed.configureTestingModule({
      imports: [InicioComponent],
      providers: [
        provideRouter([]),
        { provide: REPOSITORIO_PREFERENCIAS, useExisting: PreferenciasLocalStorageRepositorio },
      ],
    });
    preferencias = TestBed.inject(PreferenciasService);
  });

  function crear() {
    const fixture = TestBed.createComponent(InicioComponent);
    fixture.detectChanges();
    return fixture;
  }

  function texto(fixture: ReturnType<typeof crear>): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  // Tarea 5: el saludo se retiró para liberar alto de pantalla en móvil.
  it('no saluda al usuario', () => {
    expect(texto(crear())).not.toContain('¡Hola');
  });

  it('invita a abrir un reporte cuando el historial está vacío', () => {
    const fixture = crear();

    expect(texto(fixture)).toContain('Todavía no abriste ningún reporte');
    expect(texto(fixture)).toContain('menú lateral');
    expect((fixture.nativeElement as HTMLElement).querySelector('a')).toBeNull();
  });

  it('pinta una fila por reporte reciente, con su categoría y su enlace', () => {
    preferencias.registrarReporteReciente('/app/reportes/actividad-diaria/cartera', 'Cartera', 'Actividad diaria');

    const fixture = crear();
    const enlaces = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>('a.reciente-fila');

    expect(enlaces.length).toBe(1);
    expect(enlaces[0].getAttribute('href')).toBe('/app/reportes/actividad-diaria/cartera');
    expect(enlaces[0].textContent).toContain('Cartera');
    expect(enlaces[0].textContent).toContain('Actividad diaria');
  });

  /** La categoría es contexto: sin ella la fila muestra solo el título. */
  it('omite la categoría cuando el reciente no la trae', () => {
    preferencias.registrarReporteReciente('/app/incentivos/detalle', 'Detalle');

    const fila = (crear().nativeElement as HTMLElement).querySelector('a.reciente-fila')!;

    expect(fila.textContent).toContain('Detalle');
    expect(fila.querySelector('.reciente-categoria')).toBeNull();
  });

  // Es un historial, no un tablero: la tarjeta de KPI quedó fuera a propósito.
  it('no usa la tarjeta de los indicadores', () => {
    preferencias.registrarReporteReciente('/app/uno', 'Uno');

    expect((crear().nativeElement as HTMLElement).querySelector('.kpi-card')).toBeNull();
  });

  it('los muestra del más reciente al más antiguo', () => {
    preferencias.registrarReporteReciente('/app/uno', 'Uno');
    preferencias.registrarReporteReciente('/app/dos', 'Dos');

    const titulos = [
      ...(crear().nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>('a.reciente-fila'),
    ].map((a) => a.getAttribute('href'));

    expect(titulos).toEqual(['/app/dos', '/app/uno']);
  });

  it('desde() cuenta la antigüedad en palabras', () => {
    const inicio = crear().componentInstance as unknown as { desde(fecha: number): string };
    const ahora = Date.now();

    expect(inicio.desde(ahora)).toBe('Hace un momento');
    expect(inicio.desde(ahora - 5 * MINUTO)).toBe('Hace 5 min');
    expect(inicio.desde(ahora - 3 * HORA)).toBe('Hace 3 h');
    expect(inicio.desde(ahora - DIA)).toBe('Ayer');
    expect(inicio.desde(ahora - 4 * DIA)).toBe('Hace 4 días');
  });

  /** Pasada la semana el "hace N días" deja de ubicar: se muestra la fecha. */
  it('desde() cae a la fecha corta pasada una semana', () => {
    const inicio = crear().componentInstance as unknown as { desde(fecha: number): string };

    expect(inicio.desde(Date.now() - 30 * DIA)).not.toContain('Hace');
  });
});
