import { signal } from '@angular/core';
import { animarAnillos } from './animar-anillos';

it('anima el cumplimiento y omite tarjetas sin aro', () => {
  const cuadros: FrameRequestCallback[] = [];
  vi.spyOn(performance, 'now').mockReturnValue(100);
  vi.stubGlobal('requestAnimationFrame', (cuadro: FrameRequestCallback) => cuadros.push(cuadro));

  try {
    const progreso = signal<Record<string, number>>({ viejo: 4 });
    animarAnillos(
      [
        { etiqueta: 'Monto', valor: 1, comparativo: '', senal: 0, cumplimiento: 87.5 },
        { etiqueta: 'Saldo', valor: 1, comparativo: '', senal: 0 },
      ],
      progreso,
    );

    expect(progreso()).toEqual({});
    expect(cuadros).toHaveLength(1);
    cuadros.shift()!(550);
    expect(progreso()).toEqual({ Monto: 43.8 });
    cuadros.shift()!(1000);
    expect(progreso()).toEqual({ Monto: 87.5 });
    expect(cuadros).toHaveLength(0);
  } finally {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  }
});
