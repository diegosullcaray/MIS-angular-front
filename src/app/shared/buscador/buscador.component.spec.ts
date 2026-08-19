import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BuscadorComponent } from './buscador.component';
import { FUENTE_BUSQUEDA } from './fuente-busqueda';
import type { FuenteBusqueda, RegistroBuscable } from './buscador.model';

function registro(overrides: Partial<RegistroBuscable> = {}): RegistroBuscable {
  const etiqueta = overrides.etiqueta ?? 'Monitor Metas Desembolso';
  return {
    id: overrides.id ?? `nav/${etiqueta}`,
    etiqueta,
    ubicacion: 'Reportes › Avance Comercial',
    origen: 'Reportes',
    tipo: 'Reporte',
    abrir: vi.fn(),
    ...overrides,
  };
}

/** Fuente de mentira controlada por un signal, como lo son las reales. */
function fuente(id: string, registros: ReturnType<typeof signal<RegistroBuscable[]>>): FuenteBusqueda {
  return { id, registros: () => registros() };
}

describe('BuscadorComponent', () => {
  let navegacion: ReturnType<typeof signal<RegistroBuscable[]>>;
  let modulo: ReturnType<typeof signal<RegistroBuscable[]>>;

  beforeEach(() => {
    navegacion = signal<RegistroBuscable[]>([registro()]);
    modulo = signal<RegistroBuscable[]>([]);

    TestBed.configureTestingModule({
      imports: [BuscadorComponent],
      providers: [
        { provide: FUENTE_BUSQUEDA, useValue: fuente('navegacion', navegacion), multi: true },
        { provide: FUENTE_BUSQUEDA, useValue: fuente('modulo', modulo), multi: true },
      ],
    });
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

  function etiquetas(fixture: ReturnType<typeof crear>): string[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.mis-buscador-etiqueta')).map(
      (e) => (e as HTMLElement).textContent ?? ''
    );
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

  describe('cantidad de resultados listados', () => {
    /** Más de los 8 que se listaban antes, para que el total y lo visible coincidan. */
    function muchos(cantidad: number) {
      navegacion.set(
        Array.from({ length: cantidad }, (_, i) => registro({ id: `n-${i}`, etiqueta: `Cartera ${i}` }))
      );
    }

    it('lista todos los resultados, no un recorte: el total del pie es alcanzable scrolleando', () => {
      muchos(32);
      const fixture = crear();
      teclear(fixture, 'cartera');

      expect(opciones(fixture).length).toBe(32);
    });

    it('no dice "se muestran N" cuando no recortó nada', () => {
      muchos(32);
      const fixture = crear();
      teclear(fixture, 'cartera');

      const pie = elemento(fixture, '.mis-buscador-pie')?.textContent?.replace(/\s+/g, ' ') ?? '';
      expect(pie).toContain('32 resultados');
      expect(pie).not.toContain('se muestran');
    });

    it('recién avisa del recorte al pasarse del tope, informando el total real', () => {
      muchos(60);
      const fixture = crear();
      teclear(fixture, 'cartera');

      expect(opciones(fixture).length).toBe(50);
      const pie = elemento(fixture, '.mis-buscador-pie')?.textContent?.replace(/\s+/g, ' ') ?? '';
      expect(pie).toContain('60 resultados');
      expect(pie).toContain('se muestran 50');
    });
  });

  describe('fuentes de datos', () => {
    it('busca en todas las fuentes registradas a la vez', () => {
      modulo.set([registro({ id: 'd-1', etiqueta: 'Metas Comerciales', origen: 'Dashboards Integrados', tipo: 'Dashboard' })]);
      const fixture = crear();
      teclear(fixture, 'metas');

      expect(etiquetas(fixture)).toEqual(['Monitor Metas Desembolso', 'Metas Comerciales']);
    });

    it('incorpora la data de un módulo que termina de cargar con el buscador ya abierto', () => {
      const fixture = crear();
      teclear(fixture, 'metas');
      expect(opciones(fixture).length).toBe(1);

      // El módulo resuelve su carga después de que el usuario ya tecleó.
      modulo.set([registro({ id: 'd-1', etiqueta: 'Metas Comerciales', origen: 'Dashboards Integrados' })]);
      fixture.detectChanges();

      expect(opciones(fixture).length).toBe(2);
    });

    it('un módulo sin data cargada simplemente no aporta resultados', () => {
      const fixture = crear();
      teclear(fixture, 'metas');

      expect(opciones(fixture).length).toBe(1);
    });

    it('delega el abrir en la fuente, que es la que sabe qué significa su registro', () => {
      const abrir = vi.fn();
      navegacion.set([registro({ abrir })]);
      const fixture = crear();
      teclear(fixture, 'metas');

      opciones(fixture)[0].click();

      expect(abrir).toHaveBeenCalledTimes(1);
    });

    it('cierra el panel y vacía la consulta al elegir', () => {
      const fixture = crear();
      teclear(fixture, 'metas');

      opciones(fixture)[0].click();
      fixture.detectChanges();

      expect(elemento(fixture, '.mis-buscador-panel')).toBeNull();
      expect((elemento(fixture, '.mis-buscador-input') as HTMLInputElement).value).toBe('');
    });
  });

  describe('navegación por teclado', () => {
    beforeEach(() => {
      navegacion.set([
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

    it('Enter abre la opción marcada', () => {
      const abrirSegundo = vi.fn();
      navegacion.set([
        registro({ id: 'a', etiqueta: 'Cartera Vigente' }),
        registro({ id: 'b', etiqueta: 'Cartera Vencida', abrir: abrirSegundo }),
      ]);
      const fixture = crear();
      const input = teclear(fixture, 'cartera');

      teclaEn(input, 'ArrowDown');
      fixture.detectChanges();
      teclaEn(input, 'Enter');

      expect(abrirSegundo).toHaveBeenCalledTimes(1);
    });

    it('Escape limpia la consulta', () => {
      const fixture = crear();
      const input = teclear(fixture, 'cartera');

      teclaEn(input, 'Escape');
      fixture.detectChanges();

      expect(elemento(fixture, '.mis-buscador-panel')).toBeNull();
    });

    it('mantiene la opción marcada si una fuente se recarga de fondo', () => {
      const fixture = crear();
      const input = teclear(fixture, 'cartera');

      teclaEn(input, 'ArrowDown');
      fixture.detectChanges();
      expect(opciones(fixture)[1].getAttribute('aria-selected')).toBe('true');

      // Un módulo termina de cargar: eso rearma el índice, pero no es un cambio
      // pedido por el usuario y no debe moverle la selección de abajo.
      modulo.set([registro({ id: 'z', etiqueta: 'Otra cosa', origen: 'Dashboards Integrados' })]);
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

  describe('facetas', () => {
    beforeEach(() => {
      navegacion.set([
        registro({ id: 'a', etiqueta: 'Cartera Vigente', origen: 'Reportes', tipo: 'Reporte' }),
        registro({ id: 'b', etiqueta: 'Cartera Vencida', origen: 'Presupuesto', tipo: 'Reporte' }),
        registro({ id: 'c', etiqueta: 'Cartera', origen: 'Presupuesto', tipo: 'Carpeta' }),
      ]);
    });

    function chips(fixture: ReturnType<typeof crear>): HTMLElement[] {
      return Array.from(fixture.nativeElement.querySelectorAll('.mis-buscador-chip'));
    }

    function textoChips(fixture: ReturnType<typeof crear>): string[] {
      return chips(fixture).map((c) => c.textContent?.replace(/\s+/g, ' ').trim() ?? '');
    }

    it('la única faceta ofrecida es "Tipo": no hay chips por módulo', () => {
      const fixture = crear();
      teclear(fixture, 'cartera');

      const titulos = Array.from(fixture.nativeElement.querySelectorAll('.mis-buscador-faceta-titulo')).map(
        (e) => (e as HTMLElement).textContent
      );
      expect(titulos).toEqual(['Tipo']);
      expect(textoChips(fixture)).not.toContain('Reportes 1');
      expect(textoChips(fixture)).not.toContain('Presupuesto 2');
    });

    it('ofrece un chip por valor de tipo con su conteo', () => {
      const fixture = crear();
      teclear(fixture, 'cartera');

      expect(textoChips(fixture)).toEqual(['Reporte 2', 'Carpeta 1']);
    });

    it('nombra el grupo en el aria-label de cada chip', () => {
      const fixture = crear();
      teclear(fixture, 'cartera');

      expect(chips(fixture).map((c) => c.getAttribute('aria-label'))).toEqual([
        'Tipo: Reporte (2)',
        'Tipo: Carpeta (1)',
      ]);
    });

    it('al activar un chip, refina los resultados', () => {
      const fixture = crear();
      teclear(fixture, 'cartera');
      expect(opciones(fixture).length).toBe(3);

      chips(fixture).find((c) => c.textContent?.includes('Carpeta'))!.click();
      fixture.detectChanges();

      expect(etiquetas(fixture)).toEqual(['Cartera']);
    });

    it('un segundo clic sobre el mismo chip lo desactiva', () => {
      const fixture = crear();
      teclear(fixture, 'cartera');

      const chipCarpeta = () => chips(fixture).find((c) => c.textContent?.includes('Carpeta'))!;
      chipCarpeta().click();
      fixture.detectChanges();
      expect(opciones(fixture).length).toBe(1);

      chipCarpeta().click();
      fixture.detectChanges();
      expect(opciones(fixture).length).toBe(3);
    });

    it('no oculta las demás opciones de la faceta ya filtrada, para poder cambiar de una a otra', () => {
      const fixture = crear();
      teclear(fixture, 'cartera');

      chips(fixture).find((c) => c.textContent?.includes('Carpeta'))!.click();
      fixture.detectChanges();

      // "Reporte" sigue ofreciéndose con su conteo pese al filtro activo.
      expect(textoChips(fixture)).toContain('Reporte 2');
    });
  });
});
