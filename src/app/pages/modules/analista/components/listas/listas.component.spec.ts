import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ListasComponent } from './listas.component';

describe('ListasComponent', () => {
  it('expone los 2 enlaces del legado (Priorización de Leads y Becas)', () => {
    TestBed.configureTestingModule({ imports: [ListasComponent], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ListasComponent);
    fixture.detectChanges();

    const rutas = fixture.componentInstance['enlaces'].map((e) => e.ruta);
    expect(rutas).toEqual(['priorizacion-leads', 'becas']);
  });
});
