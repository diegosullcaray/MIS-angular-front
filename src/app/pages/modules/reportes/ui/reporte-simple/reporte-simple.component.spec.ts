import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ReporteSimpleComponent } from './reporte-simple.component';
import { ModSysAdminService } from '../../../../../core/winder/instances/mod-sys-admin.service';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { TABLA_VACIA } from '../../models/tabla-reporte.model';
import type { HierarquiaNodo, ParamsJerarquia } from '../../models/jerarquia.model';

const PARAMS: ParamsJerarquia = { code: 9, maxLvl: 2, dlgTitulo: 'JERARQUIA' };
const RAIZ: HierarquiaNodo = { tip_cod: 7, cod_rel: '231', desc_rel: 'Financiera Confianza', lvl: 1 };

describe('ReporteSimpleComponent', () => {
  beforeEach(() => {
    const antAdmin = {
      getBaseHierarchy: vi.fn().mockReturnValue(of({ code: '0', headers: {}, body: { base_hierarchy: [RAIZ] } })),
      getLevelHierarchy: vi.fn().mockReturnValue(of({ code: '0', headers: {}, body: { level_hierarchy: [RAIZ] } })),
    };

    TestBed.configureTestingModule({
      imports: [ReporteSimpleComponent],
      providers: [
        { provide: ModSysAdminService, useValue: antAdmin },
        ShellStateService,
      ],
    });
  });

  it('muestra el estado vacío cuando nivel es null', () => {
    const fixture = TestBed.createComponent(ReporteSimpleComponent);
    fixture.componentRef.setInput('titulo', 'Reporte Prueba');
    fixture.componentRef.setInput('paramsHier', PARAMS);
    fixture.componentRef.setInput('nivel', null);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Elige un nivel');
  });

  it('muestra la tabla cuando se proporciona un nivel', () => {
    const fixture = TestBed.createComponent(ReporteSimpleComponent);
    fixture.componentRef.setInput('titulo', 'Reporte Prueba');
    fixture.componentRef.setInput('paramsHier', PARAMS);
    fixture.componentRef.setInput('nivel', RAIZ);
    fixture.componentRef.setInput('tabla', TABLA_VACIA);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Elige un nivel');
  });
});
