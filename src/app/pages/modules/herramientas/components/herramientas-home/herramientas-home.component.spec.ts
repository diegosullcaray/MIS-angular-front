import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { HerramientasHomeComponent } from './herramientas-home.component';
import { BaseNegativaService } from '../../services/base-negativa.service';
import type { BaseNegativaBusquedaFila, TableHeaderDef } from '../../models/base-negativa.model';

function cliente(overrides: Partial<BaseNegativaBusquedaFila> = {}): BaseNegativaBusquedaFila {
  return { HCTACLI: 'C-001', HDESCLI: 'Juan Pérez', FECHA: '2026-01-01', TIPO: 'Venta', ...overrides };
}

describe('HerramientasHomeComponent', () => {
  let serviceFalso: {
    consultar: ReturnType<typeof vi.fn>;
    limpiar: ReturnType<typeof vi.fn>;
    resultados: ReturnType<typeof signal<Record<string, unknown>[]>>;
    headers: ReturnType<typeof signal<TableHeaderDef[]>>;
    cargando: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
  };
  let router: Router;

  beforeEach(() => {
    serviceFalso = {
      consultar: vi.fn(),
      limpiar: vi.fn(),
      resultados: signal([]),
      headers: signal([]),
      cargando: signal(false),
      error: signal<string | null>(null),
    };

    TestBed.configureTestingModule({
      imports: [HerramientasHomeComponent],
      providers: [provideRouter([]), { provide: BaseNegativaService, useValue: serviceFalso }],
    });
    router = TestBed.inject(Router);
  });

  function crear() {
    const fixture = TestBed.createComponent(HerramientasHomeComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('al iniciar, abre el buscador directo (igual que el legado)', () => {
    const fixture = crear();
    expect(fixture.componentInstance['mostrarBuscador']()).toBe(true);
  });

  it('al destruirse, limpia el estado del servicio', () => {
    const fixture = crear();
    fixture.destroy();
    expect(serviceFalso.limpiar).toHaveBeenCalled();
  });

  it('onClienteSeleccionado() guarda el cliente elegido y consulta su detalle', () => {
    const fixture = crear();

    fixture.componentInstance['onClienteSeleccionado'](cliente());

    expect(fixture.componentInstance['clienteActual']()).toEqual(cliente());
    expect(serviceFalso.consultar).toHaveBeenCalledWith('C-001');
  });

  it('si se cierra el buscador sin elegir cliente, navega al dashboard', () => {
    const navSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const fixture = crear();

    fixture.componentInstance['onBuscadorVisibleChange'](false);

    expect(navSpy).toHaveBeenCalledWith('/app/dashboard');
  });

  it('si se cierra el buscador después de elegir un cliente, no navega', () => {
    const navSpy = vi.spyOn(router, 'navigateByUrl');
    const fixture = crear();
    fixture.componentInstance['onClienteSeleccionado'](cliente());

    fixture.componentInstance['onBuscadorVisibleChange'](false);

    expect(navSpy).not.toHaveBeenCalled();
  });

  it('nuevaBusqueda() limpia el cliente actual y el estado del servicio, y vuelve a abrir el buscador', () => {
    const fixture = crear();
    fixture.componentInstance['onClienteSeleccionado'](cliente());
    fixture.componentInstance['mostrarBuscador'].set(false);

    fixture.componentInstance['nuevaBusqueda']();

    expect(fixture.componentInstance['clienteActual']()).toBeNull();
    expect(serviceFalso.limpiar).toHaveBeenCalled();
    expect(fixture.componentInstance['mostrarBuscador']()).toBe(true);
  });
});
