import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MessageService as PrimeNgMessageService } from 'primeng/api';
import { DatosClientesComponent } from './datos-clientes.component';
import { DatosClientesService } from '../../services/datos-clientes.service';
import { ToastService } from '../../../../../../../shared/services/toast.service';
import { DATOS_CLIENTE_FORM_VACIO } from '../../models/datos-clientes.model';
import type { AsesorSec } from '../../models/asesor-sec.model';
import type { TablaReporteResultado, FilaReporte } from '../../../../models/tabla-reporte.model';

const ASESOR: AsesorSec = { nombre: 'Juan Pérez', dni: '12345678' };
const CLIENTE: FilaReporte = { nom_cli: 'María López', num_doc: '87654321' };

function tabla(overrides: Partial<TablaReporteResultado> = {}): TablaReporteResultado {
  return { headers: [], body: [], additional: {}, ...overrides };
}

describe('DatosClientesComponent', () => {
  let servicioFalso: {
    obtenerAsesores: ReturnType<typeof vi.fn>;
    obtenerCiiu: ReturnType<typeof vi.fn>;
    obtenerClientes: ReturnType<typeof vi.fn>;
    guardar: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    servicioFalso = {
      obtenerAsesores: vi.fn().mockReturnValue(of([ASESOR])),
      obtenerCiiu: vi.fn().mockReturnValue(of([{ id: 'COM-01', desc: 'Bodega' }])),
      obtenerClientes: vi.fn().mockReturnValue(of(tabla({ body: [CLIENTE] }))),
      guardar: vi.fn().mockReturnValue(of({})),
    };
    TestBed.configureTestingModule({
      imports: [DatosClientesComponent],
      providers: [{ provide: DatosClientesService, useValue: servicioFalso }, ToastService, PrimeNgMessageService],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(DatosClientesComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('al crearse, carga asesores y CIIU', () => {
    crear();
    expect(servicioFalso.obtenerAsesores).toHaveBeenCalled();
    expect(servicioFalso.obtenerCiiu).toHaveBeenCalled();
  });

  it('onClienteSeleccionado() arranca en blanco y guarda la referencia BanTotal si el cliente no tenía datos', () => {
    const fixture = crear();
    fixture.componentInstance['onClienteSeleccionado']({ ...CLIENTE, num_tele_0: '999888777', ciiu_0_id: 'COM-01' });

    expect(fixture.componentInstance['model']()).toEqual(DATOS_CLIENTE_FORM_VACIO);
    expect(fixture.componentInstance['referencia']()).toEqual({ cel: '999888777', ciu: 'COM-01' });
    expect(fixture.componentInstance['tabActiva']()).toBe('encuesta');
  });

  describe('auto-completado desde la referencia BanTotal', () => {
    it('al marcar Verificador Teléfono, si el primer teléfono editable está vacío, lo copia de la referencia', () => {
      const fixture = crear();
      fixture.componentInstance['onClienteSeleccionado']({ ...CLIENTE, num_tele_0: '999888777' });

      fixture.componentInstance['onVerificadorNumTeleChange']('OK');

      expect(fixture.componentInstance['model']().verificadorNumTele).toBe('OK');
      expect(fixture.componentInstance['model']().cels[0].numTele).toBe('999888777');
    });

    it('no pisa el teléfono si el sectorista ya escribió uno propio', () => {
      const fixture = crear();
      fixture.componentInstance['onClienteSeleccionado']({ ...CLIENTE, num_tele_0: '999888777' });
      fixture.componentInstance['actualizarCel'](0, 'numTele', '111111111');

      fixture.componentInstance['onVerificadorNumTeleChange']('OK');

      expect(fixture.componentInstance['model']().cels[0].numTele).toBe('111111111');
    });

    it('al marcar Verificador CIIU, si el primer CIIU editable está vacío, lo copia de la referencia', () => {
      const fixture = crear();
      fixture.componentInstance['onClienteSeleccionado']({ ...CLIENTE, ciiu_0_id: 'COM-01' });

      fixture.componentInstance['onVerificadorCiiuChange']('OK');

      expect(fixture.componentInstance['model']().cius[0]).toBe('COM-01');
    });
  });

  describe('formValido()', () => {
    it('es válido con el formulario vacío (nada es obligatorio)', () => {
      const fixture = crear();
      expect(fixture.componentInstance['formValido']()).toBe(true);
    });

    it('es inválido si el email tiene formato incorrecto', () => {
      const fixture = crear();
      fixture.componentInstance['actualizarCampo']('email', 'no-es-un-email');
      expect(fixture.componentInstance['formValido']()).toBe(false);
    });

    it('es inválido si un teléfono no vacío no matchea el patrón', () => {
      const fixture = crear();
      fixture.componentInstance['actualizarCel'](0, 'numTele', '123'); // muy corto
      expect(fixture.componentInstance['formValido']()).toBe(false);
    });

    it('un teléfono vacío es válido (opcional)', () => {
      const fixture = crear();
      fixture.componentInstance['actualizarCel'](1, 'numTele', '987654321');
      expect(fixture.componentInstance['formValido']()).toBe(true);
    });
  });

  it('onGuardar() no llama al servicio si el formulario es inválido', () => {
    const fixture = crear();
    fixture.componentInstance['clienteSeleccionado'].set(CLIENTE);
    fixture.componentInstance['actualizarCampo']('email', 'inválido');

    fixture.componentInstance['onGuardar']();

    expect(servicioFalso.guardar).not.toHaveBeenCalled();
  });

  it('onGuardar() guarda, vuelve a "lista" y recarga la cartera cuando el formulario es válido', () => {
    const fixture = crear();
    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);
    fixture.componentInstance['clienteSeleccionado'].set(CLIENTE);
    fixture.componentInstance['tabActiva'].set('encuesta');
    servicioFalso.obtenerClientes.mockClear();

    fixture.componentInstance['onGuardar']();

    expect(servicioFalso.guardar).toHaveBeenCalledWith(
      CLIENTE,
      fixture.componentInstance['model'](),
      fixture.componentInstance['referencia']()
    );
    expect(fixture.componentInstance['tabActiva']()).toBe('lista');
    expect(fixture.componentInstance['clienteSeleccionado']()).toBeNull();
    expect(servicioFalso.obtenerClientes).toHaveBeenCalled();
  });

  it('onGuardar() ante un error del backend muestra un toast y no bloquea el botón', () => {
    servicioFalso.guardar.mockReturnValue(throwError(() => new Error('falló')));
    const fixture = crear();
    const toastSpy = vi.spyOn(TestBed.inject(ToastService), 'error');
    fixture.componentInstance['clienteSeleccionado'].set(CLIENTE);

    fixture.componentInstance['onGuardar']();

    expect(toastSpy).toHaveBeenCalled();
    expect(fixture.componentInstance['guardando']()).toBe(false);
  });
});
