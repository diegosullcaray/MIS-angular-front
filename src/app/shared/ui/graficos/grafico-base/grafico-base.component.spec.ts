import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import Highcharts from 'highcharts';
import { GraficoBaseComponent } from './grafico-base.component';

describe('GraficoBaseComponent', () => {
  let fixture: ComponentFixture<GraficoBaseComponent>;
  let destroySpy: ReturnType<typeof vi.fn>;
  let chartSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    destroySpy = vi.fn();
    chartSpy = vi.spyOn(Highcharts, 'chart').mockReturnValue({
      destroy: destroySpy,
    } as unknown as Highcharts.Chart);

    TestBed.configureTestingModule({
      imports: [GraficoBaseComponent],
    });

    fixture = TestBed.createComponent(GraficoBaseComponent);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('se crea correctamente', () => {
    fixture.componentRef.setInput('opciones', { series: [] });
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renderiza el título y subtítulo cuando se proporcionan', () => {
    fixture.componentRef.setInput('opciones', { series: [] });
    fixture.componentRef.setInput('titulo', 'Ventas Mensuales');
    fixture.componentRef.setInput('subtitulo', '2026');
    fixture.detectChanges();

    const h3 = fixture.nativeElement.querySelector('h3');
    const span = fixture.nativeElement.querySelector('span');

    expect(h3.textContent).toContain('Ventas Mensuales');
    expect(span.textContent).toContain('2026');
  });

  it('llama a Highcharts.chart al resolver el temporizador del effect', () => {
    fixture.componentRef.setInput('opciones', { title: { text: 'Test' } });
    fixture.detectChanges();

    vi.runAllTimers();

    expect(chartSpy).toHaveBeenCalled();
  });

  it('destruye la instancia del gráfico al destruirse el componente', () => {
    fixture.componentRef.setInput('opciones', { series: [] });
    fixture.detectChanges();
    vi.runAllTimers();

    fixture.destroy();

    expect(destroySpy).toHaveBeenCalled();
  });
});
