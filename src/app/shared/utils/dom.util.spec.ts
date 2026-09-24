import { inputValue } from './dom.util';

describe('inputValue', () => {
  it('extrae el valor de un evento nativo', () => {
    const input = document.createElement('input');
    input.value = 'consulta';

    expect(inputValue({ target: input } as unknown as Event)).toBe('consulta');
  });
});
