import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService as PrimeNgMessageService } from 'primeng/api';
import { SegurosPasivosComponent } from './seguros-pasivos.component';
import { EvolutivoPasivosComponent } from '../evolutivo-pasivos/evolutivo-pasivos.component';
import { SegurosService } from '../../services/seguros.service';
import {
  COD_JERARQUIA_ORGANIZATIVA,
  COD_JERARQUIA_SEGUROS_PASIVOS,
  NIVEL_MAXIMO_JERARQUIA_SEGUROS_PASIVOS,
} from '../../../../../../models/jerarquia.model';

/**
 * Regresión de la incidencia 7 de `docs/09-incidencias/incidencias-mora.md`:
 * "en el legacy está distribuido por tabs".
 */
describe('SegurosPasivosComponent', () => {
  function crear() {
    TestBed.configureTestingModule({
      imports: [SegurosPasivosComponent],
      providers: [
        { provide: SegurosService, useValue: { segurosPasivos: vi.fn().mockReturnValue(of([])) } },
        PrimeNgMessageService,
      ],
    });
    const fixture = TestBed.createComponent(SegurosPasivosComponent);
    fixture.detectChanges();
    return fixture.componentInstance as unknown as {
      pestanas: { id: string; titulo: string; indice: number }[];
    };
  }

  it('declara las cinco pestañas del `mat-tab-group` del legado, en su orden', () => {
    expect(crear().pestanas.map((p) => p.titulo)).toEqual([
      'Seguro Pasivo Resumen',
      'Seguros Oncológicos',
      'Vida Segura',
      'Protección Total',
      'Protección 360',
    ]);
  });

  it('cada pestaña apunta a una tabla distinta', () => {
    const indices = crear().pestanas.map((p) => p.indice);

    expect(indices).toEqual([0, 1, 2, 3, 4]);
    expect(new Set(indices).size).toBe(5);
  });
});

/**
 * Regresión de la incidencia 6: "los filtros del legacy son diferentes al que
 * migraste". No era un filtro de más ni de menos: era OTRA jerarquía. El legado
 * pide la suya con `iniHierarchy(14, 4)`, no con el `(9, 6)` de `UNI_1`.
 */
describe('EvolutivoPasivosComponent', () => {
  it('usa la jerarquía 14 con profundidad 4, no `UNI_1`', () => {
    TestBed.configureTestingModule({
      imports: [EvolutivoPasivosComponent],
      providers: [
        { provide: SegurosService, useValue: { evolutivoPasivos: vi.fn().mockReturnValue(of([])) } },
        PrimeNgMessageService,
      ],
    });
    const fixture = TestBed.createComponent(EvolutivoPasivosComponent);
    fixture.detectChanges();

    const { paramsHier } = fixture.componentInstance as unknown as {
      paramsHier: { code: number; maxLvl: number };
    };

    expect(paramsHier.code).toBe(COD_JERARQUIA_SEGUROS_PASIVOS);
    expect(paramsHier.code).not.toBe(COD_JERARQUIA_ORGANIZATIVA);
    expect(paramsHier.maxLvl).toBe(NIVEL_MAXIMO_JERARQUIA_SEGUROS_PASIVOS);
  });
});
