import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DestinoCreditoComponent } from './destino-credito.component';
import { ActividadesService } from '../../services/actividades.service';
import type { DestinoCreditoItem } from '../../models/actividades.model';
import type { IWinderResponse } from '../../../../../core/winder/winder/winder.interface';

function item(overrides: Partial<DestinoCreditoItem> = {}): DestinoCreditoItem {
  return {
    HCODSEC: 'A1',
    HDESSEC: 'Ana Torres',
    HCTACLI: 'C-001',
    HDESCLI: 'Cliente Uno',
    HCODOPE: 'OP-1',
    HFECDES: '2026-01-01',
    HMONDES: 1000,
    ...overrides,
  };
}

describe('DestinoCreditoComponent', () => {
  let getSpy: ReturnType<typeof vi.fn>;
  let postSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getSpy = vi.fn().mockReturnValue(of({ code: '0', headers: {}, body: { resultado: { result: [] } } } as IWinderResponse));
    postSpy = vi.fn().mockReturnValue(of({}));

    TestBed.configureTestingModule({
      imports: [DestinoCreditoComponent],
      providers: [{ provide: ActividadesService, useValue: { getRegResultadosDestCred: getSpy, postRegResultadosDestCred: postSpy } }],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(DestinoCreditoComponent);
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

    expect(fixture.componentInstance.error()).toBe('No se pudo cargar la información de Destino de Crédito.');
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('carga la lista completa en data(), sin filtrar (el filtrado por asesor lo hace app-data-table)', () => {
    getSpy.mockReturnValue(of({ code: '0', headers: {}, body: { resultado: { result: [item(), item({ HCODSEC: 'B2' })] } } } as IWinderResponse));
    const fixture = crear();

    expect(fixture.componentInstance.data().length).toBe(2);
  });

  it('columnas() incluye el campo de asesor (código y nombre) para búsqueda y visualización', () => {
    const fixture = crear();

    const campos = fixture.componentInstance['columnas'].map((c) => c.field);

    expect(campos).toEqual(
      expect.arrayContaining(['HCODSEC', 'HDESSEC'])
    );
  });

  it('abrirEdicion() guarda el ítem seleccionado y abre el modal', () => {
    const fixture = crear();
    const it = item();

    fixture.componentInstance['abrirEdicion'](it);

    expect(fixture.componentInstance.selectedItem()).toEqual(it);
    expect(fixture.componentInstance.modalVisible()).toBe(true);
  });

  it('guardarEdicion() actualiza localmente el ítem editado (fecha de visita y cumplimiento)', () => {
    getSpy.mockReturnValue(of({ code: '0', headers: {}, body: { resultado: { result: [item({ HCODOPE: 'OP-1' }), item({ HCODOPE: 'OP-2' })] } } } as IWinderResponse));
    const fixture = crear();

    fixture.componentInstance['guardarEdicion']({ cod_ope: 'OP-1', fec_vis: '2026-02-01', is_valid: 'Si' });

    expect(postSpy).toHaveBeenCalledWith({ cod_ope: 'OP-1', fec_vis: '2026-02-01', is_valid: 'Si' });
    const actualizado = fixture.componentInstance.data().find((x) => x.HCODOPE === 'OP-1');
    expect(actualizado?.HFECVIS).toBe('2026-02-01');
    expect(actualizado?.HCUMPLDC).toBe('Si');

    const sinTocar = fixture.componentInstance.data().find((x) => x.HCODOPE === 'OP-2');
    expect(sinTocar?.HFECVIS).toBeUndefined();
  });
});
