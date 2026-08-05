import { TestBed } from '@angular/core/testing';
import { ListSkeletonComponent } from './list-skeleton.component';

describe('ListSkeletonComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ListSkeletonComponent] });
  });

  it('usa 5 filas y 5 columnas por defecto', () => {
    const fixture = TestBed.createComponent(ListSkeletonComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.rows()).toEqual([1, 2, 3, 4, 5]);
    expect(fixture.componentInstance.cols()).toEqual([1, 2, 3, 4, 5]);
  });

  it('renderiza una fila de skeleton por cada elemento de rows()', () => {
    const fixture = TestBed.createComponent(ListSkeletonComponent);
    fixture.componentRef.setInput('rows', [1, 2, 3]);
    fixture.componentRef.setInput('cols', [1, 2]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const raiz = el.querySelector('div.flex.flex-col') as HTMLElement;
    // Una fila por elemento de rows(), más el header.
    expect(raiz.children.length).toBe(1 + 3); // 1 header + 3 filas
  });

  it('getCellWidth() rota entre los anchos predefinidos', () => {
    const fixture = TestBed.createComponent(ListSkeletonComponent);
    const instancia = fixture.componentInstance;

    expect(instancia.getCellWidth(0)).toBe('80%');
    expect(instancia.getCellWidth(4)).toBe('90%');
    expect(instancia.getCellWidth(5)).toBe('80%'); // vuelve a rotar (índice 5 % 5 === 0)
  });
});
