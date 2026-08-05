import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ProspectosCorresponsalComponent } from './prospectos-corresponsal.component';
import { ActividadesService } from '../../services/actividades.service';
import type { ProspectoCorresponsalItem } from '../../models/actividades.model';
import type { IWinderResponse } from '../../../../../core/winder/winder/winder.interface';

function item(overrides: Partial<ProspectoCorresponsalItem> = {}): ProspectoCorresponsalItem {
  return { HAPENOMB: 'Juan Pérez', HNUMDOC: '12345678', HNUMRUC: '20123456789', HCELULAR: '999999999', HDIREC: 'Av. Siempre Viva 123', ...overrides };
}

describe('ProspectosCorresponsalComponent', () => {
  let getSpy: ReturnType<typeof vi.fn>;
  let postSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getSpy = vi.fn().mockReturnValue(of({ code: '0', headers: {}, body: { resultado: { result: [] } } } as IWinderResponse));
    postSpy = vi.fn().mockReturnValue(of({}));

    TestBed.configureTestingModule({
      imports: [ProspectosCorresponsalComponent],
      providers: [{ provide: ActividadesService, useValue: { getRegResultadosListProsp: getSpy, postRegResultadosProsp: postSpy } }],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(ProspectosCorresponsalComponent);
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
    expect(fixture.componentInstance.error()).toBe('No se pudo cargar la información de Prospectos de Corresponsal.');
  });

  it('filteredData() filtra por nombre, DNI o RUC', () => {
    getSpy.mockReturnValue(
      of({ code: '0', headers: {}, body: { resultado: { result: [item(), item({ HAPENOMB: 'María López', HNUMDOC: '87654321', HNUMRUC: '20999999999' })] } } } as IWinderResponse)
    );
    const fixture = crear();

    fixture.componentInstance.globalFilter.set('maría');

    expect(fixture.componentInstance.filteredData().map((x) => x.HAPENOMB)).toEqual(['María López']);
  });

  it('abrirNuevoRegistro() resetea el formulario a sus valores por defecto y abre el modal', () => {
    const fixture = crear();
    const instancia = fixture.componentInstance;
    instancia['nuevo'].HAPENOMB = 'Algo que ya se había escrito';

    instancia['abrirNuevoRegistro']();

    expect(instancia['nuevo'].HAPENOMB).toBe('');
    expect(instancia['nuevo'].HVINFAMI).toBe('NO');
    expect(instancia['nuevo'].HTIPVINC).toBe('NINGUNO');
    expect(instancia.modalVisible()).toBe(true);
    expect(instancia['formErrors']).toEqual({});
  });

  it('guardarRegistro() no guarda si faltan campos requeridos, y reporta los errores', () => {
    const fixture = crear();
    const instancia = fixture.componentInstance;
    instancia['abrirNuevoRegistro']();

    instancia['guardarRegistro']();

    expect(postSpy).not.toHaveBeenCalled();
    expect(instancia['formErrors']['HAPENOMB']).toBeTruthy();
    expect(instancia['formErrors']['HNUMDOC']).toBeTruthy();
    expect(instancia['formErrors']['HCELULAR']).toBeTruthy();
    expect(instancia['formErrors']['HDIREC']).toBeTruthy();
  });

  it('guardarRegistro() con datos válidos, guarda, cierra el modal y recarga la lista', () => {
    const fixture = crear();
    const instancia = fixture.componentInstance;
    instancia['abrirNuevoRegistro']();
    Object.assign(instancia['nuevo'], { HAPENOMB: 'Juan Pérez', HNUMDOC: '12345678', HCELULAR: '999999999', HDIREC: 'Av. Siempre Viva 123' });

    instancia['guardarRegistro']();

    expect(postSpy).toHaveBeenCalledWith(instancia['nuevo']);
    expect(instancia.modalVisible()).toBe(false);
    expect(instancia.guardando()).toBe(false);
    expect(getSpy).toHaveBeenCalledTimes(2); // carga inicial + recarga tras guardar
  });

  it('onSearchInput() actualiza globalFilter', () => {
    const fixture = crear();
    const input = document.createElement('input');
    input.value = 'juan';

    fixture.componentInstance['onSearchInput']({ target: input } as unknown as Event);

    expect(fixture.componentInstance.globalFilter()).toBe('juan');
  });
});
