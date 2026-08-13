import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { BecasComponent } from './becas.component';
import { AnalistaService } from '../../services/analista.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import type { ColaboradorActivo, ColaboradorItem, NodoJerarquiaAncla } from '../../models/colaborador.model';
import type { FilaBeca } from '../../models/listas.model';

const ANCLA: NodoJerarquiaAncla = { tip_cod: 7, cod_rel: '231' };
const FILAS: FilaBeca[] = [
  { ind_pro: 0, seg_cli: 'PYME', des_cli: 'Cliente 1', num_doc: '111' },
  { ind_pro: 1, seg_cli: 'MICRO', des_cli: 'Cliente 2', num_doc: '222', des_pro: 'Prospectado', ori_sec: 'BT-001', fec_pro: '2026-08-01', com_pro: 'ok' },
];

describe('BecasComponent', () => {
  let analistaFalso: {
    esAdmin: ReturnType<typeof vi.fn>;
    colaboradorActivo: ReturnType<typeof signal<ColaboradorActivo | null>>;
    usarColaboradorPropio: ReturnType<typeof vi.fn>;
    establecerColaborador: ReturnType<typeof vi.fn>;
    obtenerAnclaAdmin: ReturnType<typeof vi.fn>;
    obtenerColaboradores: ReturnType<typeof vi.fn>;
    obtenerListaBecas: ReturnType<typeof vi.fn>;
    prospectarBeca: ReturnType<typeof vi.fn>;
  };
  let toastFalso: { exito: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    analistaFalso = {
      esAdmin: vi.fn().mockReturnValue(false),
      colaboradorActivo: signal<ColaboradorActivo | null>(null),
      usarColaboradorPropio: vi.fn(() => analistaFalso.colaboradorActivo.set({ codBt: 'BT-001', nombre: 'Ana Torres' })),
      establecerColaborador: vi.fn((item: ColaboradorItem) =>
        analistaFalso.colaboradorActivo.set({ codBt: item.cod_sec, nombre: item.des_sec })
      ),
      obtenerAnclaAdmin: vi.fn().mockReturnValue(of(ANCLA)),
      obtenerColaboradores: vi.fn().mockReturnValue(of([{ cod_sec: 'SEC-1', des_sec: 'Juan Pérez' }])),
      obtenerListaBecas: vi.fn().mockReturnValue(of(FILAS)),
      prospectarBeca: vi.fn().mockReturnValue(of({ exito: true, fecPro: '2026-08-09' })),
    };
    toastFalso = { exito: vi.fn(), error: vi.fn() };

    TestBed.configureTestingModule({
      imports: [BecasComponent],
      providers: [
        { provide: AnalistaService, useValue: analistaFalso },
        { provide: ToastService, useValue: toastFalso },
      ],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(BecasComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('para un colaborador (no admin), carga su propia lista de becas', () => {
    const fixture = crear();
    expect(analistaFalso.usarColaboradorPropio).toHaveBeenCalled();
    expect(analistaFalso.obtenerListaBecas).toHaveBeenCalledWith('BT-001');
    expect(fixture.componentInstance['filas']()).toEqual(FILAS);
  });

  it('para un admin, no carga nada hasta elegir colaborador', () => {
    analistaFalso.esAdmin.mockReturnValue(true);
    const fixture = crear();
    expect(analistaFalso.obtenerListaBecas).not.toHaveBeenCalled();
    expect(fixture.componentInstance['filas']()).toEqual([]);
  });

  it('seleccionarFila() fija la fila elegida', () => {
    const fixture = crear();
    fixture.componentInstance['seleccionarFila'](FILAS[0]);
    expect(fixture.componentInstance['filaSeleccionada']()).toEqual(FILAS[0]);
  });

  it('detalleFilas() arma las filas label/valor a partir de la fila seleccionada', () => {
    const fixture = crear();
    fixture.componentInstance['seleccionarFila'](FILAS[1]);

    expect(fixture.componentInstance['detalleFilas']()).toEqual([
      { lab: 'Cliente', val: 'Cliente 2' },
      { lab: 'Estado', val: 'Prospectado' },
      { lab: 'Segmento', val: 'MICRO' },
      { lab: 'Usuario', val: 'BT-001' },
      { lab: 'Fecha', val: '2026-08-01' },
      { lab: 'Comentario', val: 'ok' },
    ]);
  });

  it('confirmarProspectar() marca la fila como prospectada y muestra un toast de éxito', () => {
    const fixture = crear();
    const instancia = fixture.componentInstance;
    instancia['seleccionarFila'](FILAS[0]);
    instancia['comentario'].set('Muy interesado');

    instancia['confirmarProspectar']();

    expect(analistaFalso.prospectarBeca).toHaveBeenCalledWith('BT-001', '111', 'Muy interesado');
    expect(FILAS[0].ind_pro).toBe(1);
    expect(FILAS[0].com_pro).toBe('Muy interesado');
    expect(FILAS[0].fec_pro).toBe('2026-08-09');
    expect(toastFalso.exito).toHaveBeenCalled();
    expect(instancia['dialogProspectarAbierto']()).toBe(false);
  });

  it('confirmarProspectar() muestra un toast de error si el backend responde sin éxito', () => {
    analistaFalso.prospectarBeca.mockReturnValue(of({ exito: false }));
    const fixture = crear();
    fixture.componentInstance['seleccionarFila'](FILAS[0]);

    fixture.componentInstance['confirmarProspectar']();

    expect(toastFalso.error).toHaveBeenCalled();
  });

  it('cargar() muestra un mensaje de error genérico si falla la petición', () => {
    analistaFalso.obtenerListaBecas.mockReturnValue(throwError(() => new Error('fail')));
    const fixture = crear();
    expect(fixture.componentInstance['error']()).toBe('No se pudo cargar la lista de becas. Inténtalo de nuevo en unos segundos.');
  });

  it('abrirSelectorColaborador() pide la lista de colaboradores usando el nodo ancla', () => {
    analistaFalso.esAdmin.mockReturnValue(true);
    const fixture = crear();

    fixture.componentInstance['abrirSelectorColaborador']();
    fixture.detectChanges();

    expect(analistaFalso.obtenerColaboradores).toHaveBeenCalledWith(7, '231');
    expect(fixture.componentInstance['cargandoColaboradores']()).toBe(false);
  });

  it('abrirSelectorColaborador() muestra el spinner de carga si se hace click antes de que resuelva el nodo ancla', () => {
    analistaFalso.esAdmin.mockReturnValue(true);
    analistaFalso.obtenerAnclaAdmin.mockReturnValue(new Subject<NodoJerarquiaAncla | null>());
    const fixture = crear();
    const instancia = fixture.componentInstance;

    instancia['abrirSelectorColaborador']();
    fixture.detectChanges();

    expect(instancia['dialogColaboradorAbierto']()).toBe(true);
    expect(instancia['cargandoColaboradores']()).toBe(true);
    expect(analistaFalso.obtenerColaboradores).not.toHaveBeenCalled();
  });
});
