import { semaforo, severidadSemaforo } from './semaforo.util';

it('distingue cero válido de dato ausente o inválido', () => {
  expect(semaforo(0)).toBe(0);
  expect(semaforo('0')).toBe(0);
  expect(semaforo('')).toBeNull();
  expect(semaforo('desconocido')).toBeNull();
  expect(severidadSemaforo('desconocido')).toBe('info');
});
