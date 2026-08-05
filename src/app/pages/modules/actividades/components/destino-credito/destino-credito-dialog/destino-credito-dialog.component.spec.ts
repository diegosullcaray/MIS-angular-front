import { TestBed } from '@angular/core/testing';
import { DestinoCreditoDialogComponent } from './destino-credito-dialog.component';
import type { DestinoCreditoItem } from '../../../models/actividades.model';

function item(overrides: Partial<DestinoCreditoItem> = {}): DestinoCreditoItem {
  return {
    HCODSEC: 'A1',
    HDESSEC: 'Ana Torres',
    HCTACLI: 'C-001',
    HDESCLI: 'Cliente Uno',
    HCODOPE: 'OP-1',
    HFECDES: '2026-01-01',
    HMONDES: 1000,
    HFECVIS: '2026-02-01',
    HCUMPLDC: 'Si',
    ...overrides,
  };
}

describe('DestinoCreditoDialogComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [DestinoCreditoDialogComponent] });
  });

  function crear(itemData: DestinoCreditoItem | null) {
    const fixture = TestBed.createComponent(DestinoCreditoDialogComponent);
    fixture.componentRef.setInput('itemData', itemData);
    fixture.detectChanges();
    return fixture;
  }

  it('ngOnChanges precarga los campos del formulario a partir del ítem', () => {
    const fixture = crear(item());
    const instancia = fixture.componentInstance;

    expect(instancia['codAsesor']).toBe('A1');
    expect(instancia['asesor']).toBe('Ana Torres');
    expect(instancia['desCli']).toBe('Cliente Uno');
    expect(instancia['ctaCli']).toBe('C-001');
    expect(instancia['codOpe']).toBe('OP-1');
    expect(instancia['fecVis']).toEqual(new Date('2026-02-01'));
    expect(instancia['cumpleDestino']).toBe(true);
  });

  it('cumpleDestino es false cuando HCUMPLDC no es "Si"', () => {
    const fixture = crear(item({ HCUMPLDC: 'No' }));
    expect(fixture.componentInstance['cumpleDestino']).toBe(false);
  });

  it('fecVis queda null si el ítem no trae HFECVIS', () => {
    const fixture = crear(item({ HFECVIS: undefined }));
    expect(fixture.componentInstance['fecVis']).toBeNull();
  });

  it('guardar() exige la fecha de visita antes de emitir', () => {
    const fixture = crear(item({ HFECVIS: undefined }));
    const instancia = fixture.componentInstance;
    let emitido = false;
    instancia.onGuardar.subscribe(() => (emitido = true));

    instancia['guardar']();

    expect(instancia['fecVisError']).toBe(true);
    expect(emitido).toBe(false);
  });

  it('guardar() emite el payload con fecha (YYYY-MM-DD) y el flag Si/No, y cierra el diálogo', () => {
    const fixture = crear(item());
    const instancia = fixture.componentInstance;

    let payload: { cod_ope: string; fec_vis: string; is_valid: string } | undefined;
    instancia.onGuardar.subscribe((p) => (payload = p));
    let visibleEmitido: boolean | undefined;
    instancia.visibleChange.subscribe((v) => (visibleEmitido = v));

    instancia['guardar']();

    expect(payload).toEqual({ cod_ope: 'OP-1', fec_vis: '2026-02-01', is_valid: 'Si' });
    expect(visibleEmitido).toBe(false);
  });

  it('cerrar() emite visibleChange(false)', () => {
    const fixture = crear(item());
    let visibleEmitido: boolean | undefined;
    fixture.componentInstance.visibleChange.subscribe((v) => (visibleEmitido = v));

    fixture.componentInstance['cerrar']();

    expect(visibleEmitido).toBe(false);
  });
});
