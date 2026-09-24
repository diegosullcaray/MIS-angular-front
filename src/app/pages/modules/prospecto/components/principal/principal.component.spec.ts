import { TestBed } from '@angular/core/testing';
import { PrincipalComponent } from './principal.component';
import { ProspectoService } from '../../services/prospecto.service';

describe('PrincipalComponent (Prospecto)', () => {
  function montar(estado: Partial<Record<'cargando' | 'error' | 'vacio', unknown>> = {}) {
    const consultar = vi.fn();
    const limpiar = vi.fn();
    const doble = {
      consultar,
      limpiar,
      filas: () => [],
      cargando: () => estado.cargando ?? false,
      error: () => estado.error ?? null,
      vacio: () => estado.vacio ?? true,
      totalRegistros: () => 0,
      totalMonto: () => 0,
    };

    TestBed.configureTestingModule({
      imports: [PrincipalComponent],
      providers: [{ provide: ProspectoService, useValue: doble }],
    });

    const fixture = TestBed.createComponent(PrincipalComponent);
    fixture.detectChanges();
    return { fixture, consultar, limpiar };
  }

  it('consulta al iniciar', () => {
    const { consultar } = montar();
    expect(consultar).toHaveBeenCalledOnce();
  });

  it('muestra el error con acción de reintento y no el estado vacío', () => {
    const { fixture } = montar({ error: 'Backend caído', vacio: false });
    const html = fixture.nativeElement.textContent as string;

    expect(html).toContain('Backend caído');
    expect(html).not.toContain('Sin resultados');
  });

  it('limpia el estado del servicio al destruirse', () => {
    const { fixture, limpiar } = montar();
    fixture.destroy();
    expect(limpiar).toHaveBeenCalledOnce();
  });
});
