import { TestBed } from '@angular/core/testing';
import { EsqueletoGraficoComponent } from './esqueleto-grafico.component';

describe('EsqueletoGraficoComponent', () => {
  it('pinta la silueta de columnas y se anuncia como ocupado', () => {
    const fixture = TestBed.createComponent(EsqueletoGraficoComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[role="status"]')?.getAttribute('aria-busy')).toBe('true');
    expect(el.querySelectorAll('.animate-pulse').length).toBeGreaterThan(5);
  });
});
