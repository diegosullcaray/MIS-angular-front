import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, beforeEach, expect, it, vi } from 'vitest';
import { MessageService } from 'primeng/api';
import { ToastService } from '../../../../../../../../../../../shared/services/toast.service';
import { TABLA_DINAMICA_VACIA } from '../../../../../../../../models/tabla-dinamica.model';
import { CeroCuotasNuevasService } from '../../../../services/cero-cuotas-nuevas.service';
import { CeroCuotasDashboardRevisionComponent } from './dashboard-revision.component';

describe('CeroCuotasDashboardRevisionComponent', () => {
  const servicio = {
    dashboardRevision: vi.fn().mockReturnValue(of([])),
    kpisDashboardRevision: vi.fn().mockReturnValue(of([])),
    topAsesoresDashboardRevision: vi.fn().mockReturnValue(of(TABLA_DINAMICA_VACIA)),
    mapasCalorDashboardRevision: vi.fn().mockReturnValue(of([])),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      imports: [CeroCuotasDashboardRevisionComponent],
      providers: [
        MessageService,
        {
          provide: ToastService,
          useValue: { error: vi.fn(), exito: vi.fn(), advertencia: vi.fn(), info: vi.fn() },
        },
        { provide: CeroCuotasNuevasService, useValue: servicio },
      ],
    });
  });

  it('consulta los tres recursos al seleccionar un nodo jerárquico', () => {
    const fixture = TestBed.createComponent(CeroCuotasDashboardRevisionComponent);
    fixture.detectChanges();
    const instancia = fixture.componentInstance as unknown as {
      onNivelSeleccionado(nodo: { tip_cod: number; cod_rel: string }): void;
    };

    instancia.onNivelSeleccionado({ tip_cod: 9, cod_rel: 'FC' });
    fixture.detectChanges();

    expect(servicio.dashboardRevision).toHaveBeenCalledWith({ tip_cod: 9, cod_rel: 'FC' });
    expect(servicio.kpisDashboardRevision).toHaveBeenCalledWith({ tip_cod: 9, cod_rel: 'FC' });
    expect(servicio.topAsesoresDashboardRevision).toHaveBeenCalledWith({
      tip_cod: 9,
      cod_rel: 'FC',
    });
    expect(servicio.mapasCalorDashboardRevision).toHaveBeenCalledWith({
      tip_cod: 9,
      cod_rel: 'FC',
    });
  });

  it('hace drill-down solo al pulsar la descripción de un asesor válido', () => {
    const fixture = TestBed.createComponent(CeroCuotasDashboardRevisionComponent);
    const instancia = fixture.componentInstance as unknown as {
      onTopAsesorSeleccionado(evento: { clave: string; fila: Record<string, unknown> }): void;
    };

    instancia.onTopAsesorSeleccionado({
      clave: 'descripcion',
      fila: { htipcod: '18', hcodrel: 'A-01', descripcion: 'Agencia' },
    });
    fixture.detectChanges();

    expect(servicio.dashboardRevision).toHaveBeenCalledWith({ tip_cod: 18, cod_rel: 'A-01' });
    expect(servicio.kpisDashboardRevision).toHaveBeenCalledWith({ tip_cod: 18, cod_rel: 'A-01' });
    instancia.onTopAsesorSeleccionado({ clave: 'saldo', fila: { htipcod: '20', hcodrel: 'T-01' } });
    fixture.detectChanges();
    expect(servicio.dashboardRevision).toHaveBeenCalledTimes(1);
  });
});
