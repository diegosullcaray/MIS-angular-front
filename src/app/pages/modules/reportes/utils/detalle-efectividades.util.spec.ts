import { paramsDetalleComunes } from './detalle-efectividades.util';

it('conserva los parámetros y la fecha del contrato Ant del detalle', () => {
  expect(
    paramsDetalleComunes({
      asesor: 'Ana',
      fechaCompromiso: new Date(2026, 8, 7),
      ultimaGestion: 'SI',
      pagina: 3,
    }),
  ).toEqual({ pagen: 3, nom: '%Ana%', resp: 'SI', fcompro: '07/09/2026' });
});
