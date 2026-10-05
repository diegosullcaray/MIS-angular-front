import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, Subject, throwError } from 'rxjs';
import { TABLERO_DEMO } from '../../constantes/actividad-comercial-demo.constantes';
import type { TableroAsesor } from '../../models/actividad-comercial.model';
import { ActividadComercialService } from '../../services/actividad-comercial.service';
import { PrincipalComponent } from './principal.component';

class ServicioControlado extends ActividadComercialService {
  fuente: Observable<TableroAsesor> = new Subject<TableroAsesor>();
  protected override obtener(): Observable<TableroAsesor> {
    return this.fuente;
  }
}

describe('PrincipalComponent (Actividad Comercial)', () => {
  function montar(fuente: Observable<TableroAsesor>): ComponentFixture<PrincipalComponent> {
    TestBed.configureTestingModule({
      providers: [{ provide: ActividadComercialService, useClass: ServicioControlado }],
    });
    (TestBed.inject(ActividadComercialService) as ServicioControlado).fuente = fuente;
    const fixture = TestBed.createComponent(PrincipalComponent);
    fixture.detectChanges();
    return fixture;
  }

  const raiz = (fixture: ComponentFixture<PrincipalComponent>) => fixture.nativeElement as HTMLElement;

  it('mientras carga muestra el esqueleto y ninguna tarjeta', () => {
    const el = raiz(montar(new Subject<TableroAsesor>()));

    expect(el.querySelector('app-list-skeleton')).not.toBeNull();
    expect(el.querySelector('app-tarjeta-cartera')).toBeNull();
  });

  it('con el tablero pinta las seis tarjetas y el corte', () => {
    const fuente = new Subject<TableroAsesor>();
    const fixture = montar(fuente);

    fuente.next(TABLERO_DEMO);
    fixture.detectChanges();

    const el = raiz(fixture);
    for (const tarjeta of ['desempeno', 'desembolsos', 'mora', 'seguros', 'cartera', 'clientes']) {
      expect(el.querySelector(`app-tarjeta-${tarjeta}`), tarjeta).not.toBeNull();
    }
    expect(el.textContent).toContain('Corte al 29/09/2026');
  });

  it('un error se muestra como error, no como tablero vacío', () => {
    const el = raiz(montar(throwError(() => new Error('falló'))));

    expect(el.querySelector('app-inline-error')).not.toBeNull();
    expect(el.querySelector('app-tarjeta-desempeno')).toBeNull();
  });
});
