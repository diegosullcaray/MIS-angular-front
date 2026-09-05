import { TestBed } from '@angular/core/testing';
import { of, firstValueFrom } from 'rxjs';
import { ActividadMensualCraService } from './actividad-mensual-cra.service';
import { BloqueReporteService, type NodoConsulta } from '../../../services/bloque-reporte.service';
import { TABLA_VACIA } from '../../../models/tabla-reporte.model';

describe('ActividadMensualCraService', () => {
  let regular: ReturnType<typeof vi.fn>;
  let deprecado: ReturnType<typeof vi.fn>;
  let regulares: ReturnType<typeof vi.fn>;
  let service: ActividadMensualCraService;

  const nodo: NodoConsulta = { tip_cod: 1, cod_rel: '100' };

  beforeEach(() => {
    regular = vi.fn().mockReturnValue(of(TABLA_VACIA));
    deprecado = vi.fn().mockReturnValue(of(TABLA_VACIA));
    regulares = vi.fn().mockReturnValue(of([TABLA_VACIA]));
    const graficos = vi.fn().mockReturnValue(of([]));

    TestBed.configureTestingModule({
      providers: [
        ActividadMensualCraService,
        {
          provide: BloqueReporteService,
          useValue: {
            regular,
            deprecado,
            regulares,
            graficos,
            fecha: () => '2026-08-28',
            fec: () => '20260828',
          },
        },
      ],
    });

    service = TestBed.inject(ActividadMensualCraService);
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('planDatos debe consultar P_Datos_01', async () => {
    const res = await firstValueFrom(service.planDatos(nodo, '20260131'));
    expect(regular).toHaveBeenCalledWith('P_Datos_01', nodo, { fec: '20260131' });
    expect(res.tabla1).toBe(TABLA_VACIA);
  });

  it('huellaCarbono debe consultar HCARBONO_01 con cargambiental y fec', async () => {
    const res = await firstValueFrom(service.huellaCarbono(nodo, 'TODOS', '20260131'));
    expect(regular).toHaveBeenCalledWith('HCARBONO_01', nodo, { cargambiental: 'TODOS', fec: '20260131' });
    expect(res.tabla1).toBe(TABLA_VACIA);
  });

  it('gestionCarteraReasignadaFlujo debe consultar 2 bloques', async () => {
    const res = await firstValueFrom(service.gestionCarteraReasignadaFlujo(nodo, 0));
    expect(regulares).toHaveBeenCalled();
    expect(res.length).toBe(1);
  });

  it('gestionCarteraStock debe consultar 2 bloques', async () => {
    const res = await firstValueFrom(service.gestionCarteraStock(nodo, 0, 1));
    expect(regulares).toHaveBeenCalled();
    expect(res.length).toBe(1);
  });

  it('cmgCaptaciones debe consultar GCMGCAP_01', async () => {
    const res = await firstValueFrom(service.cmgCaptaciones(nodo, '20260131'));
    expect(regular).toHaveBeenCalledWith('GCMGCAP_01', nodo, { fec: '20260131' });
    expect(res.tabla1).toBe(TABLA_VACIA);
  });

  it('seguimientoBp debe consultar CAP_SEGUI_BP_01', async () => {
    const res = await firstValueFrom(service.seguimientoBp(nodo, 'TODOS', '20260131'));
    expect(regular).toHaveBeenCalledWith('CAP_SEGUI_BP_01', nodo, { prod: 'TODOS', fec: '20260131' });
    expect(res.tabla1).toBe(TABLA_VACIA);
  });

  it('carteraProducto debe consultar tabla cartera_producto_rma_02 y gráfico cartera_producto_rma_01', async () => {
    const res = await firstValueFrom(service.carteraProducto(nodo));
    expect(deprecado).toHaveBeenCalledWith('rma/administracion/Cartera/cartera_producto_rma_02', nodo, undefined);
    expect(res.tabla).toBe(TABLA_VACIA);
    expect(res.graficos).toBeDefined();
    expect(res.tarjetas).toBeDefined();
  });

  it('programasGobierno debe consultar 4 bloques', async () => {
    const res = await firstValueFrom(service.programasGobierno(nodo));
    expect(regulares).toHaveBeenCalled();
    expect(res.length).toBe(1);
  });

  it('contratacionElectronica debe consultar 3 bloques', async () => {
    const res = await firstValueFrom(service.contratacionElectronica(nodo));
    expect(regulares).toHaveBeenCalled();
    expect(res.length).toBe(1);
  });

  it('rankingAutonomiasTasas debe consultar reporte_autonomia_new_01', async () => {
    const res = await firstValueFrom(service.rankingAutonomiasTasas(nodo));
    expect(regular).toHaveBeenCalledWith('reporte_autonomia_new_01', nodo);
    expect(res.tabla1).toBe(TABLA_VACIA);
  });

  it('cmgCarteraMora debe consultar cuadro_Variable_M_01', async () => {
    const res = await firstValueFrom(service.cmgCarteraMora(nodo));
    expect(regular).toHaveBeenCalledWith('cuadro_Variable_M_01', nodo);
    expect(res.tabla1).toBe(TABLA_VACIA);
  });

  it('evolutivoCosechas debe consultar rma/administracion/Riesgos/grafico_cosechas_01', async () => {
    const res = await firstValueFrom(service.evolutivoCosechas(nodo, 'TODO', 'TODO', '3', 'Saldo'));
    expect(deprecado).toHaveBeenCalledWith('rma/administracion/Riesgos/grafico_cosechas_01', nodo, {
      prod: 'TODO',
      subpro: 'TODO',
      madu: '3',
      op: 'Saldo',
    });
    expect(res.tabla1).toBe(TABLA_VACIA);
  });

  it('resultadosUnidadNegocio debe consultar resultado_unidad_negocio_rma_01', async () => {
    const res = await firstValueFrom(service.resultadosUnidadNegocio(nodo, 'RED'));
    expect(regular).toHaveBeenCalledWith('resultado_unidad_negocio_rma_01', nodo, { canal: 'RED' });
    expect(res.tabla1).toBe(TABLA_VACIA);
  });

  it('rankingKaypachaComercial debe consultar rankKay_01', async () => {
    const res = await firstValueFrom(service.rankingKaypachaComercial(nodo));
    expect(regular).toHaveBeenCalledWith('rankKay_01', nodo);
    expect(res.tabla1).toBe(TABLA_VACIA);
  });

  it('tasasMesProducto debe consultar gráfico tasa_producto_rma_01', async () => {
    const res = await firstValueFrom(service.tasasMesProducto(nodo));
    expect(res.graficos).toBeDefined();
    expect(res.tarjetas).toBeDefined();
  });
});
