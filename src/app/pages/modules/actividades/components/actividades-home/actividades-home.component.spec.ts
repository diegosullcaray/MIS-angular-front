import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActividadesHomeComponent } from './actividades-home.component';

describe('ActividadesHomeComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ActividadesHomeComponent],
      providers: [provideRouter([])],
    });
  });

  it('expone las 3 tarjetas de actividades con sus rutas', () => {
    const fixture = TestBed.createComponent(ActividadesHomeComponent);
    fixture.detectChanges();

    const rutas = fixture.componentInstance.cards.map((c) => c.ruta);
    expect(rutas).toEqual(['dest-credito', 'reg-prosp-corr', 'regprosp-corr']);
  });

  it('renderiza el título de cada tarjeta', () => {
    const fixture = TestBed.createComponent(ActividadesHomeComponent);
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Destino de Crédito');
    expect(texto).toContain('Prospectos Corresponsal');
    expect(texto).toContain('Transacciones Corresponsal');
  });
});
