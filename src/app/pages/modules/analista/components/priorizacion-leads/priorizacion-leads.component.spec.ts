import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { PriorizacionLeadsComponent } from './priorizacion-leads.component';
import { AnalistaService, type ColaboradorActivo } from '../../services/analista.service';
import type { FilaLead, NodoJerarquiaAncla } from '../../models';

const ANCLA: NodoJerarquiaAncla = { tip_cod: 7, cod_rel: '231' };
const FILAS: FilaLead[] = [
  { cod_evt: 'EVT-1', des_evt: 'Campaña 1', tip_doc: 'DNI', num_doc: '111', des_cli: 'Cliente 1', ord_ges: 1, fec_ges: '2026-08-01' },
  { cod_evt: 'EVT-2', des_evt: 'Campaña 2', tip_doc: 'DNI', num_doc: '222', des_cli: 'Cliente 2', ord_ges: 2, fec_ges: '2026-08-02' },
];

describe('PriorizacionLeadsComponent', () => {
  let analistaFalso: {
    esAdmin: ReturnType<typeof vi.fn>;
    colaboradorActivo: ReturnType<typeof signal<ColaboradorActivo | null>>;
    usarColaboradorPropio: ReturnType<typeof vi.fn>;
    establecerColaborador: ReturnType<typeof vi.fn>;
    obtenerAnclaAdmin: ReturnType<typeof vi.fn>;
    obtenerColaboradores: ReturnType<typeof vi.fn>;
    obtenerListaPrioLeads: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    analistaFalso = {
      esAdmin: vi.fn().mockReturnValue(false),
      colaboradorActivo: signal<ColaboradorActivo | null>(null),
      usarColaboradorPropio: vi.fn(() => analistaFalso.colaboradorActivo.set({ codBt: 'BT-001', nombre: 'Ana Torres' })),
      establecerColaborador: vi.fn(),
      obtenerAnclaAdmin: vi.fn().mockReturnValue(of(ANCLA)),
      obtenerColaboradores: vi.fn().mockReturnValue(of([{ cod_sec: 'SEC-1', des_sec: 'Juan Pérez' }])),
      obtenerListaPrioLeads: vi.fn().mockReturnValue(of(FILAS)),
    };

    TestBed.configureTestingModule({
      imports: [PriorizacionLeadsComponent],
      providers: [{ provide: AnalistaService, useValue: analistaFalso }],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(PriorizacionLeadsComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('para un colaborador (no admin), carga su propia lista de leads', () => {
    const fixture = crear();
    expect(analistaFalso.usarColaboradorPropio).toHaveBeenCalled();
    expect(analistaFalso.obtenerListaPrioLeads).toHaveBeenCalledWith('BT-001');
    expect(fixture.componentInstance['filas']()).toEqual(FILAS);
  });

  it('para un admin, no carga nada hasta elegir colaborador', () => {
    analistaFalso.esAdmin.mockReturnValue(true);
    const fixture = crear();
    expect(analistaFalso.obtenerListaPrioLeads).not.toHaveBeenCalled();
    expect(fixture.componentInstance['filas']()).toEqual([]);
  });

  it('cargar() muestra un mensaje de error genérico si falla la petición', () => {
    analistaFalso.obtenerListaPrioLeads.mockReturnValue(throwError(() => new Error('fail')));
    const fixture = crear();
    expect(fixture.componentInstance['error']()).toBe('No se pudo cargar la lista de leads. Inténtalo de nuevo en unos segundos.');
  });

  it('abrirSelectorColaborador() pide la lista de colaboradores usando el nodo ancla', () => {
    analistaFalso.esAdmin.mockReturnValue(true);
    const fixture = crear();

    fixture.componentInstance['abrirSelectorColaborador']();

    expect(analistaFalso.obtenerColaboradores).toHaveBeenCalledWith(7, '231');
  });

  it('onColaboradorSeleccionado() delega en el servicio', () => {
    const fixture = crear();
    const item = { cod_sec: 'SEC-2', des_sec: 'Otro Analista' };

    fixture.componentInstance['onColaboradorSeleccionado'](item);

    expect(analistaFalso.establecerColaborador).toHaveBeenCalledWith(item);
  });
});
