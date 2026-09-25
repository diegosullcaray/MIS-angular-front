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

  it('colorEstado() usa la paleta del legado: 0 rojo, 1 verde, otro gris', () => {
    const fixture = crear();
    expect(fixture.componentInstance['colorEstado'](0)).toBe('var(--mis-inc-semaforo-mal)');
    expect(fixture.componentInstance['colorEstado'](1)).toBe('var(--mis-inc-semaforo-bien)');
    expect(fixture.componentInstance['colorEstado'](2)).toBe('var(--mis-inc-semaforo-neutro)');
  });

  it('cada ícono del semáforo lleva el nombre y el estado en su tooltip, para cuando el texto no se ve', () => {
    const chip = (crear().nativeElement as HTMLElement).querySelector('.semaforo-chip');
    expect(chip?.getAttribute('title')).toBe('Cartera: cumple');
    expect(chip?.querySelector('.sr-only')?.textContent?.trim()).toBe('cumple');
  });

  // El nivel se cambia solo desde la barra de la ventana ("Seleccionar nivel"):
  // la tarjeta de perfil no tiene un segundo botón para lo mismo.
  it('no trae un botón propio para cambiar de nivel, ni siquiera si puede elegirlo', () => {
    incentivosFalso.puedeElegirNivel.set(true);
    const fixture = crear();
    expect((fixture.nativeElement as HTMLElement).querySelector('.pi-search, [aria-label="Cambiar de nivel"]')).toBeNull();
  });

  it('abrirCalculadora se reemite desde el monetizado-card anidado', () => {
    const fixture = crear();
    const emitido = vi.fn();
    fixture.componentInstance.abrirCalculadora.subscribe(emitido);

    fixture.componentInstance['abrirCalculadora'].emit();

    expect(emitido).toHaveBeenCalled();
  });
});
