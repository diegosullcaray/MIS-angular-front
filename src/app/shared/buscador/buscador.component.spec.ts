import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Component } from '@angular/core';
import { BuscadorComponent } from './buscador.component';
import { NavegacionSistemasService } from '../../pages/full-pages/layout/services/navegacion-sistemas.service';
import { ShellStateService } from '../../core/services/shell-state.service';
import type { RegistroNavegacion } from '../../pages/full-pages/layout/interfaces/sidebar.model';

@Component({ selector: 'app-blank', standalone: true, template: '' })
class BlankComponent {}

function registro(overrides: Partial<RegistroNavegacion> = {}): RegistroNavegacion {
  const etiqueta = overrides.etiqueta ?? 'Monitor Metas Desembolso';
  return {
    id: overrides.id ?? `reportes/${etiqueta}`,
    etiqueta,
    sistema: 'Reportes',
    sistemaId: 'sist-rep',
    tipo: 'Reporte',
    ruta: '/app/reportes/mon-desem',
    carpetas: [],
    nodo: { etiqueta, ruta: '/app/reportes/mon-desem' },
    ubicacion: 'Reportes',
    ...overrides,
  };
}

describe('BuscadorComponent', () => {
  let shell: ShellStateService;
  let router: Router;
  let navegacionFalsa: {
    registros: ReturnType<typeof signal<RegistroNavegacion[]>>;
    abrirEnCarpeta: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    navegacionFalsa = {
      registros: signal<RegistroNavegacion[]>([registro()]),
      abrirEnCarpeta: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [BuscadorComponent],
      providers: [
        provideRouter([{ path: '**', component: BlankComponent }]),
        { provide: NavegacionSistemasService, useValue: navegacionFalsa },
      ],
    });

    shell = TestBed.inject(ShellStateService);
    router = TestBed.inject(Router);
  });

  function crear() {
    const fixture = TestBed.createComponent(BuscadorComponent);
    fixture.detectChanges();
    return fixture;
  }

  function elemento(fixture: ReturnType<typeof crear>, selector: string): HTMLElement | null {
    return fixture.nativeElement.querySelector(selector);
  }

  /** Enfoca y teclea, que es lo que despliega el panel de resultados. */
  function teclear(fixture: ReturnType<typeof crear>, texto: string) {
    const input = elemento(fixture, '.mis-buscador-input') as HTMLInputElement;
    input.dispatchEvent(new Event('focus'));
    input.value = texto;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    return input;
  }

  function opciones(fixture: ReturnType<typeof crear>): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.mis-buscador-opcion'));
  }

  it('no despliega el panel sin nada tecleado', () => {
    const fixture = crear();
    (elemento(fixture, '.mis-buscador-input') as HTMLInputElement).dispatchEvent(new Event('focus'));
    fixture.detectChanges();

    expect(elemento(fixture, '.mis-buscador-panel')).toBeNull();
  });

  it('despliega los resultados al teclear y resalta la coincidencia', () => {
    const fixture = crear();
    teclear(fixture, 'metas');

    expect(opciones(fixture).length).toBe(1);
    expect(elemento(fixture, '.mis-buscador-etiqueta')?.innerHTML).toContain('<mark>Metas</mark>');
  });

  it('busca en todos los sistemas, no solo en la carpeta abierta', () => {
    navegacionFalsa.registros.set([
      registro({ id: 'a', etiqueta: 'Cartera Créditos', sistema: 'Presupuesto', ubicacion: 'Presupuesto › Activos' }),
      registro({ id: 'b', etiqueta: 'Categorización', sistema: 'Analista', ubicacion: 'Analista' }),
    ]);
    const fixture = crear();
    teclear(fixture, 'categ');

    expect(opciones(fixture).length).toBe(1);
    expect(elemento(fixture, '.mis-buscador-etiqueta')?.textContent).toBe('Categorización');
  });

  it('tolera typos, como el motor de Algolia', () => {
    const fixture = crear();
    teclear(fixture, 'desenbolzo');

    expect(opciones(fixture).length).toBe(1);
  });

  it('muestra el estado vacío cuando no hay coincidencias', () => {
    const fixture = crear();
    teclear(fixture, 'zzzzzzz');

    expect(opciones(fixture).length).toBe(0);
    expect(elemento(fixture, '.mis-buscador-vacio')?.textContent).toContain('zzzzzzz');
  });

  it('informa el total de resultados y cuánto tardó', () => {
    const fixture = crear();
    teclear(fixture, 'metas');

    expect(elemento(fixture, '.mis-buscador-pie')?.textContent).toMatch(/1 resultado .* ms/);
  });

  describe('navegación por teclado', () => {
    beforeEach(() => {
      navegacionFalsa.registros.set([
        registro({ id: 'a', etiqueta: 'Cartera Vigente' }),
        registro({ id: 'b', etiqueta: 'Cartera Vencida' }),
      ]);
    });

    function teclaEn(input: HTMLInputElement, key: string) {
      input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    }

    it('arranca con la primera opción marcada', () => {
      const fixture = crear();
      teclear(fixture, 'cartera');

      expect(opciones(fixture)[0].getAttribute('aria-selected')).toBe('true');
    });

    it('la flecha abajo baja de opción y la de arriba vuelve, dando la vuelta', () => {
      const fixture = crear();
      const input = teclear(fixture, 'cartera');

      teclaEn(input, 'ArrowDown');
      fixture.detectChanges();
      expect(opciones(fixture)[1].getAttribute('aria-selected')).toBe('true');

      // Desde la última, vuelve a la primera.
      teclaEn(input, 'ArrowDown');
      fixture.detectChanges();
      expect(opciones(fixture)[0].getAttribute('aria-selected')).toBe('true');

      teclaEn(input, 'ArrowUp');
      fixture.detectChanges();
      expect(opciones(fixture)[1].getAttribute('aria-selected')).toBe('true');
    });

    it('Enter abre la opción marcada', async () => {
      const navegar = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
      const fixture = crear();
      const input = teclear(fixture, 'cartera');

      teclaEn(input, 'ArrowDown');
      fixture.detectChanges();
      teclaEn(input, 'Enter');

      expect(navegar).toHaveBeenCalledWith('/app/reportes/mon-desem');
    });

    it('Escape limpia la consulta', () => {
      const fixture = crear();
      const input = teclear(fixture, 'cartera');

      teclaEn(input, 'Escape');
      fixture.detectChanges();

      expect(elemento(fixture, '.mis-buscador-panel')).toBeNull();
    });

    it('mantiene la opción marcada si el árbol de navegación se recarga de fondo', () => {
      const fixture = crear();
      const input = teclear(fixture, 'cartera');

      teclaEn(input, 'ArrowDown');
      fixture.detectChanges();
      expect(opciones(fixture)[1].getAttribute('aria-selected')).toBe('true');

      // El menú STG (o las categorías de Kaypacha) termina de resolver y
      // reemplaza la lista por otra equivalente: eso rearma el índice, pero no
      // es un cambio pedido por el usuario y no debe moverle la selección.
      navegacionFalsa.registros.set([
        registro({ id: 'a', etiqueta: 'Cartera Vigente' }),
        registro({ id: 'b', etiqueta: 'Cartera Vencida' }),
      ]);
      fixture.detectChanges();

      expect(opciones(fixture)[1].getAttribute('aria-selected')).toBe('true');
    });

    it('vuelve a marcar la primera opción cuando cambia la consulta', () => {
      const fixture = crear();
      const input = teclear(fixture, 'cartera');

      teclaEn(input, 'ArrowDown');
      fixture.detectChanges();
      expect(opciones(fixture)[1].getAttribute('aria-selected')).toBe('true');

      teclear(fixture, 'cartera v');

      expect(opciones(fixture)[0].getAttribute('aria-selected')).toBe('true');
    });

    it('expone la opción marcada con aria-activedescendant, sin sacar el foco del input', () => {
      const fixture = crear();
      const input = teclear(fixture, 'cartera');

      teclaEn(input, 'ArrowDown');
      fixture.detectChanges();

      expect(input.getAttribute('aria-activedescendant')).toBe(opciones(fixture)[1].id);
    });
  });

  describe('abrir un resultado', () => {
    it('un Reporte navega a su ruta y marca su sistema como activo', () => {
      const navegar = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
      shell.setContenidoPendienteSeleccion(true);
      const fixture = crear();
      teclear(fixture, 'metas');

      opciones(fixture)[0].click();
      fixture.detectChanges();

      expect(navegar).toHaveBeenCalledWith('/app/reportes/mon-desem');
      expect(shell.sidebarIconActivo()).toBe('sist-rep');
      expect(shell.contenidoPendienteSeleccion()).toBe(false);
    });

    it('una Carpeta abre el explorador posicionado en ella, sin navegar', () => {
      const navegar = vi.spyOn(router, 'navigateByUrl');
      const carpetaPadre = { etiqueta: 'Avance Comercial' };
      const nodo = { etiqueta: 'Colocaciones', hijos: [{ etiqueta: 'Hoja', ruta: '/x' }] };
      navegacionFalsa.registros.set([
        registro({
          id: 'c',
          etiqueta: 'Colocaciones',
          tipo: 'Carpeta',
          ruta: undefined,
          carpetas: [carpetaPadre],
          nodo,
          ubicacion: 'Reportes › Avance Comercial',
        }),
      ]);
      const fixture = crear();
      teclear(fixture, 'coloca');

      opciones(fixture)[0].click();

      expect(navegacionFalsa.abrirEnCarpeta).toHaveBeenCalledWith('sist-rep', [carpetaPadre, nodo]);
      expect(navegar).not.toHaveBeenCalled();
    });

    it('cierra el panel y vacía la consulta al elegir', () => {
      vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
      const fixture = crear();
      teclear(fixture, 'metas');

      opciones(fixture)[0].click();
      fixture.detectChanges();

      expect(elemento(fixture, '.mis-buscador-panel')).toBeNull();
      expect((elemento(fixture, '.mis-buscador-input') as HTMLInputElement).value).toBe('');
    });
  });

  describe('facetas', () => {
    beforeEach(() => {
      navegacionFalsa.registros.set([
        registro({ id: 'a', etiqueta: 'Cartera Vigente', sistema: 'Reportes' }),
        registro({ id: 'b', etiqueta: 'Cartera Vencida', sistema: 'Presupuesto' }),
        registro({ id: 'c', etiqueta: 'Cartera Total', sistema: 'Presupuesto' }),
      ]);
    });

    function chips(fixture: ReturnType<typeof crear>): HTMLElement[] {
      return Array.from(fixture.nativeElement.querySelectorAll('.mis-buscador-chip'));
    }

    it('ofrece un chip por valor de faceta con su conteo', () => {
      const fixture = crear();
      teclear(fixture, 'cartera');

      const textos = chips(fixture).map((c) => c.textContent?.replace(/\s+/g, ' ').trim());
      expect(textos).toContain('Presupuesto 2');
      expect(textos).toContain('Reportes 1');
    });

    it('al activar un chip, refina los resultados', () => {
      const fixture = crear();
      teclear(fixture, 'cartera');
      expect(opciones(fixture).length).toBe(3);

      chips(fixture).find((c) => c.textContent?.includes('Reportes'))!.click();
      fixture.detectChanges();

      expect(opciones(fixture).length).toBe(1);
      expect(elemento(fixture, '.mis-buscador-etiqueta')?.textContent).toBe('Cartera Vigente');
    });

    it('un segundo clic sobre el mismo chip lo desactiva', () => {
      const fixture = crear();
      teclear(fixture, 'cartera');

      const chipReportes = () => chips(fixture).find((c) => c.textContent?.includes('Reportes'))!;
      chipReportes().click();
      fixture.detectChanges();
      expect(opciones(fixture).length).toBe(1);

      chipReportes().click();
      fixture.detectChanges();
      expect(opciones(fixture).length).toBe(3);
    });

    it('no oculta las demás opciones de una faceta ya filtrada, para poder cambiar de una a otra', () => {
      const fixture = crear();
      teclear(fixture, 'cartera');

      chips(fixture).find((c) => c.textContent?.includes('Reportes'))!.click();
      fixture.detectChanges();

      // "Presupuesto" sigue ofreciéndose con su conteo pese al filtro activo.
      expect(chips(fixture).map((c) => c.textContent?.replace(/\s+/g, ' ').trim())).toContain('Presupuesto 2');
    });
  });
});
