import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MessageService as PrimeNgMessageService } from 'primeng/api';
import { AgregarProspectoDialogComponent } from './agregar-prospecto-dialog.component';
import { ProspectoCorresponsalService } from '../../../services/prospecto-corresponsal.service';
import { ToastService } from '../../../../../../../../shared/services/toast.service';
import { PROSPECTO_CORRESPONSAL_FORM_VACIO } from '../../../models/prospecto-corresponsal.model';
import type { OpcionJerarquia, ProspectoCorresponsalForm } from '../../../models/prospecto-corresponsal.model';

const JERARQUIA: OpcionJerarquia[] = [
  { id: 'AG-1', desc: 'Agencia Centro', sec_eco: 'Agencia' },
  { id: 'TE-1', desc: 'Territorio Norte', sec_eco: 'Territorio' },
  { id: 'CI-1', desc: 'Comercio', sec_eco: 'ciiu' },
];

/** Formulario con todos los campos requeridos completos (menos `HLICFUNCI`, condicional) — para probar el camino feliz de guardado. */
const FORMULARIO_VALIDO: ProspectoCorresponsalForm = {
  ...PROSPECTO_CORRESPONSAL_FORM_VACIO,
  HAPENOMB: 'Juan Pérez',
  HNUMDOC: '12345678',
  HNUMRUC: '12345678901',
  HCELULAR: '987654321',
  HDCIIU: 'CI-1',
  HDIREC: 'Av. Siempre Viva 123',
  HDEPA: 'DEP-1',
  HPROV: 'PROV-1',
  HDISTR: 'DIS-1',
  HDESTER: 'TE-1',
  HDESCOR: 'COR-1',
  HDESAGE: 'AG-1',
  HGEOLATI: '-12.05',
  HGEOLON: '-77.03',
  HNOMCOM: 'Bodega Juan',
  HTIPAGENT: 'Agente Confianza',
  HTAPERCC: '5 min',
  HCONSRUC: 'OK',
  HCONSRCC: 'OK',
  HCTALICEF: 'NO',
  HCANACAP: 'Woccu',
  HCODSECASIG: 'BT-001',
  HASEASIG: 'María López',
};

describe('AgregarProspectoDialogComponent', () => {
  let servicioFalso: { obtenerJerarquia: ReturnType<typeof vi.fn>; guardarProspecto: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    servicioFalso = {
      obtenerJerarquia: vi.fn().mockReturnValue(of(JERARQUIA)),
      guardarProspecto: vi.fn().mockReturnValue(of({})),
    };
    TestBed.configureTestingModule({
      imports: [AgregarProspectoDialogComponent],
      providers: [
        { provide: ProspectoCorresponsalService, useValue: servicioFalso },
        ToastService,
        PrimeNgMessageService,
      ],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(AgregarProspectoDialogComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('al crearse, carga la jerarquía y la agrupa por categoría (sec_eco)', () => {
    const fixture = crear();
    expect(servicioFalso.obtenerJerarquia).toHaveBeenCalled();
    expect(fixture.componentInstance['opcionesAgencia']()).toEqual([JERARQUIA[0]]);
    expect(fixture.componentInstance['opcionesTerritorio']()).toEqual([JERARQUIA[1]]);
    expect(fixture.componentInstance['opcionesCiiu']()).toEqual([JERARQUIA[2]]);
    expect(fixture.componentInstance['opcionesCorredor']()).toEqual([]);
  });

  it('el formulario arranca inválido (campos requeridos vacíos)', () => {
    const fixture = crear();
    expect(fixture.componentInstance['prospectoForm']().invalid()).toBe(true);
  });

  it('HLICFUNCI solo se vuelve visible/requerido cuando HCTALICEF es "SI"', () => {
    const fixture = crear();
    const instancia = fixture.componentInstance;

    expect(instancia['prospectoForm'].HLICFUNCI().hidden()).toBe(true);

    instancia['actualizarCampo']('HCTALICEF', 'SI');
    expect(instancia['prospectoForm'].HLICFUNCI().hidden()).toBe(false);
    expect(instancia['prospectoForm'].HLICFUNCI().invalid()).toBe(true);

    instancia['actualizarCampo']('HLICFUNCI', 'LIC-001');
    expect(instancia['prospectoForm'].HLICFUNCI().valid()).toBe(true);
  });

  it('onGuardar() no llama al servicio si el formulario es inválido', () => {
    const fixture = crear();
    fixture.componentInstance['onGuardar']();
    expect(servicioFalso.guardarProspecto).not.toHaveBeenCalled();
  });

  it('onGuardar() guarda, emite guardado, y cierra el diálogo cuando el formulario es válido', () => {
    const fixture = crear();
    const instancia = fixture.componentInstance;
    instancia['model'].set(FORMULARIO_VALIDO);

    const emitidos: void[] = [];
    instancia.guardado.subscribe(() => emitidos.push(undefined));
    const visibleChangeSpy = vi.spyOn(instancia.visibleChange, 'emit');

    instancia['onGuardar']();

    expect(servicioFalso.guardarProspecto).toHaveBeenCalledWith(FORMULARIO_VALIDO);
    expect(emitidos.length).toBe(1);
    expect(visibleChangeSpy).toHaveBeenCalledWith(false);
    expect(instancia['model']()).toEqual(PROSPECTO_CORRESPONSAL_FORM_VACIO);
  });

  it('onGuardar() avisa con un toast si falla el guardado, sin cerrar el diálogo', () => {
    servicioFalso.guardarProspecto.mockReturnValue(throwError(() => new Error('falló')));
    const fixture = crear();
    const instancia = fixture.componentInstance;
    instancia['model'].set(FORMULARIO_VALIDO);
    const toastSpy = vi.spyOn(TestBed.inject(ToastService), 'error');

    instancia['onGuardar']();

    expect(toastSpy).toHaveBeenCalled();
    expect(instancia['guardando']()).toBe(false);
  });
});
