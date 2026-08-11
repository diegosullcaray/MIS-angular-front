import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PerfilCardComponent } from './perfil-card.component';
import { IncentivosService } from '../../services/incentivos.service';
import type { ItemSemaforo, MonetizadoIncentivo, PerfilUsuarioIncentivo } from '../../models';

describe('PerfilCardComponent', () => {
  let incentivosFalso: {
    perfil: ReturnType<typeof signal<PerfilUsuarioIncentivo | null>>;
    semaforo: ReturnType<typeof signal<ItemSemaforo[]>>;
    cargando: ReturnType<typeof signal<boolean>>;
    puedeElegirNivel: ReturnType<typeof signal<boolean>>;
    monetizado: ReturnType<typeof signal<MonetizadoIncentivo>>;
    fechaActual: ReturnType<typeof signal<string>>;
    seleccionarFecha: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    incentivosFalso = {
      perfil: signal({ nombre: 'Juan Pérez', nivel: 'CARGO', descripcionNivel: 'Asesor', imagenUrl: '' }),
      semaforo: signal<ItemSemaforo[]>([
        { id: 'car', des: 'Cartera', icono: 'pi pi-briefcase', val: 1, show: true },
        { id: 'gru', des: 'Grupos', icono: 'pi pi-briefcase', val: 0, show: false },
      ]),
      cargando: signal(false),
      puedeElegirNivel: signal(false),
      monetizado: signal({
        bonoBase: 0, bonoPlus: 0, bonoSuperPlus: 0, bonoTotal: 0, codigoSituacion: 0, descripcionSituacion: '--',
        puedeSimular: false, modelo: '2026', modeloDescripcion: 'M2026', mostrarModelo: false, fechasHabilitadas: [],
      }),
      fechaActual: signal('20260115'),
      seleccionarFecha: vi.fn(),
    };
    TestBed.configureTestingModule({
      imports: [PerfilCardComponent],
      providers: [{ provide: IncentivosService, useValue: incentivosFalso }],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(PerfilCardComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('semaforoVisible() solo incluye los ítems con show=true', () => {
    const fixture = crear();
    expect(fixture.componentInstance['semaforoVisible']().map((s) => s.id)).toEqual(['car']);
  });

  it('claseIcono() distingue mal(0)/regular(1)/bien(otro)', () => {
    const fixture = crear();
    expect(fixture.componentInstance['claseIcono'](0)).toContain('danger');
    expect(fixture.componentInstance['claseIcono'](1)).toContain('warning');
    expect(fixture.componentInstance['claseIcono'](2)).toContain('success');
  });

  it('abrirSelector emite al hacer clic en el botón de cambiar nivel (si puedeElegirNivel)', () => {
    incentivosFalso.puedeElegirNivel.set(true);
    const fixture = crear();
    const emitido = vi.fn();
    fixture.componentInstance.abrirSelector.subscribe(emitido);

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.pi-search')?.click();

    expect(emitido).toHaveBeenCalled();
  });

  it('no muestra el botón de cambiar nivel si puedeElegirNivel es false', () => {
    const fixture = crear();
    expect((fixture.nativeElement as HTMLElement).querySelector('.pi-search')).toBeNull();
  });

  it('abrirCalculadora se reemite desde el monetizado-card anidado', () => {
    const fixture = crear();
    const emitido = vi.fn();
    fixture.componentInstance.abrirCalculadora.subscribe(emitido);

    fixture.componentInstance['abrirCalculadora'].emit();

    expect(emitido).toHaveBeenCalled();
  });
});
