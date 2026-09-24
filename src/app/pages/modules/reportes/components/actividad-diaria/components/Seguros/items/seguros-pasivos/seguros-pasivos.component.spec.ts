import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService as PrimeNgMessageService } from 'primeng/api';
import { SegurosPasivosComponent } from './seguros-pasivos.component';
import { SegurosService } from '../../services/seguros.service';

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
