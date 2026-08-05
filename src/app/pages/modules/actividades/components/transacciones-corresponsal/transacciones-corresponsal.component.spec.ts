import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TransaccionesCorresponsalComponent } from './transacciones-corresponsal.component';
import { ActividadesService } from '../../services/actividades.service';
import type { TransaccionCorresponsalItem } from '../../models/actividades.model';
import type { IWinderResponse } from '../../../../../core/winder/winder/winder.interface';

function item(overrides: Partial<TransaccionCorresponsalItem> = {}): TransaccionCorresponsalItem {
  return { HAPENOMB: 'Juan Pérez', HNUMDOC: '12345678', HCONSRCC: 'OK', ...overrides };
}

describe('TransaccionesCorresponsalComponent', () => {
  let getSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getSpy = vi.fn().mockReturnValue(of({ code: '0', headers: {}, body: { resultado: { result: [] } } } as IWinderResponse));

    TestBed.configureTestingModule({
      imports: [TransaccionesCorresponsalComponent],
      providers: [{ provide: ActividadesService, useValue: { getRegResultadosListProsp: getSpy } }],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(TransaccionesCorresponsalComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('carga los datos al iniciar', () => {
    const fixture = crear();
    expect(getSpy).toHaveBeenCalled();
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('muestra un error si falla la carga', () => {
    getSpy.mockReturnValue(throwError(() => new Error('backend caído')));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const fixture = crear();
    expect(fixture.componentInstance.error()).toBe('No se pudo cargar la información de Transacciones.');
  });

  it('filteredData() filtra por nombre, DNI o consulta RCC', () => {
    getSpy.mockReturnValue(
      of({ code: '0', headers: {}, body: { resultado: { result: [item(), item({ HAPENOMB: 'María López', HNUMDOC: '87654321', HCONSRCC: 'PENDIENTE' })] } } } as IWinderResponse)
    );
    const fixture = crear();

    fixture.componentInstance.globalFilter.set('pendiente');

    expect(fixture.componentInstance.filteredData().map((x) => x.HAPENOMB)).toEqual(['María López']);
  });

  it('sin filtro, filteredData() devuelve todos los registros', () => {
    getSpy.mockReturnValue(of({ code: '0', headers: {}, body: { resultado: { result: [item(), item()] } } } as IWinderResponse));
    const fixture = crear();

    expect(fixture.componentInstance.filteredData().length).toBe(2);
  });

  it('onSearchInput() actualiza globalFilter', () => {
    const fixture = crear();
    const input = document.createElement('input');
    input.value = 'juan';

    fixture.componentInstance['onSearchInput']({ target: input } as unknown as Event);

    expect(fixture.componentInstance.globalFilter()).toBe('juan');
  });
});
