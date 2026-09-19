import { identidadConsulta } from './identidad-consulta.util';
import type { UsuarioActivo } from '../../core/interfaces/shell-state.model';

describe('identidadConsulta', () => {
  const usuario: UsuarioActivo = {
    id: '1', nombre: 'Prueba', email: 'prueba@example.org', rol: 'supervisor-area',
    subsistemas: [], codBt: '001', fechaCorte: '20260917',
  };

  it('incluye identidad, permisos y corte, no presentación', () => {
    expect(identidadConsulta({ ...usuario, nombre: 'Otro nombre' })).toBe(identidadConsulta(usuario));
    for (const cambio of [{ id: '2' }, { email: 'otro@example.org' }, { codBt: '002' }, { rol: 'admin-sistema' as const }, { fechaCorte: '20260918' }]) {
      expect(identidadConsulta({ ...usuario, ...cambio })).not.toBe(identidadConsulta(usuario));
    }
    expect(identidadConsulta(null)).not.toBe(identidadConsulta(usuario));
  });
});
