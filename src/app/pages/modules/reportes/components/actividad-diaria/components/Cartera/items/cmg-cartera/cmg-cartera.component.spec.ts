import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { MessageService } from 'primeng/api';
import { CmgCarteraComponent } from './cmg-cartera.component';
import { CarteraRepositorioService } from '../../services/cartera-repositorio.service';
import type { CmgCarteraResultado } from '../../../../../../models/cmg-cartera.model';
import type { HierarquiaNodo } from '../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 1, cod_rel: '100', desc_rel: 'Unidad 100', lvl: 1 };
const REPORTE: CmgCarteraResultado = { tabla: { columnas: [], filas: [] }, tarjetas: [] };

describe('CmgCarteraComponent diario', () => {
  let consultas: Subject<CmgCarteraResultado>[];

  beforeEach(() => {
    consultas = [];
    TestBed.configureTestingModule({
      imports: [CmgCarteraComponent],
      providers: [
        MessageService,
        {
          provide: CarteraRepositorioService,
          useValue: {
            cmgCartera: vi.fn(() => {
              const consulta = new Subject<CmgCarteraResultado>();
              consultas.push(consulta);
              return consulta;
            }),
          },
        },
      ],
    });
  });

  it('cancela la consulta anterior al cambiar de fase', () => {
    const fixture = TestBed.createComponent(CmgCarteraComponent);
    fixture.detectChanges();
    fixture.componentInstance['onNivelSeleccionado'](NODO);
    fixture.detectChanges();
    fixture.componentInstance['cambiarFase'](2);
    fixture.detectChanges();
    expect(consultas).toHaveLength(2);
    expect(consultas[0].observed).toBe(false);
    consultas[1].next(REPORTE);
    expect(fixture.componentInstance['reporte']()).toEqual(REPORTE);
  });

  it('muestra error persistente y permite reintentar', () => {
    const fixture = TestBed.createComponent(CmgCarteraComponent);
    fixture.detectChanges();
    fixture.componentInstance['onNivelSeleccionado'](NODO);
    fixture.detectChanges();
    consultas[0].error(new Error('backend'));
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('app-inline-error')).not.toBeNull();
    fixture.componentInstance['reintentar']();
    fixture.detectChanges();
    expect(consultas).toHaveLength(2);
  });
});
