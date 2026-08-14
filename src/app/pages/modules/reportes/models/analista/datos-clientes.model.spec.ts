import { DATOS_CLIENTE_FORM_VACIO, celVacio, filaAFormulario, filaAReferencia, formularioAJson } from './datos-clientes.model';

describe('datos-clientes.model', () => {
  it('filaAFormulario() parsea cels/cius (string JSON) y toma email/ver_ciiu/ver_num_tele de la fila', () => {
    const fila = {
      email: 'cliente@correo.com',
      ver_num_tele: 'OK',
      ver_ciiu: 'NO OK',
      cels: JSON.stringify([
        { num_tele: '987654321', tipo_tele: 'SMARTPHONE', ope_tele: 'Claro', plan_tele: 'Prepago', whatshap: true },
      ]),
      cius: JSON.stringify(['COM-01', 'SER-02']),
    };

    const form = filaAFormulario(fila);

    expect(form.email).toBe('cliente@correo.com');
    expect(form.verificadorNumTele).toBe('OK');
    expect(form.verificadorCiiu).toBe('NO OK');
    expect(form.cels[0]).toEqual({
      numTele: '987654321',
      tipoTele: 'SMARTPHONE',
      opeTele: 'Claro',
      planTele: 'Prepago',
      whatshap: true,
    });
    expect(form.cels[1]).toEqual(celVacio()); // solo había 1 en el JSON — el segundo queda vacío
    expect(form.cius).toEqual(['COM-01', 'SER-02', '']);
  });

  it('filaAFormulario() no explota si la fila no tiene cels/cius (cliente nunca actualizado)', () => {
    const form = filaAFormulario({});
    expect(form).toEqual(DATOS_CLIENTE_FORM_VACIO);
  });

  it('filaAReferencia() toma num_tele_0/ciiu_0_id (el teléfono/CIIU ya registrado en BanTotal)', () => {
    expect(filaAReferencia({ num_tele_0: '999888777', ciiu_0_id: 'COM-01' })).toEqual({ cel: '999888777', ciu: 'COM-01' });
    expect(filaAReferencia({})).toEqual({ cel: '', ciu: '' });
  });

  it('formularioAJson() arma el payload snake_case anidado que espera el legado (bantotal.ciu/cel incluidos)', () => {
    const form = {
      ...DATOS_CLIENTE_FORM_VACIO,
      email: 'a@b.com',
      cels: [{ ...celVacio(), numTele: '987654321' }, celVacio()] as [ReturnType<typeof celVacio>, ReturnType<typeof celVacio>],
    };

    const json = formularioAJson(form, { cel: '111222333', ciu: 'COM-01' });

    expect(json).toEqual({
      email: 'a@b.com',
      verificador_ciiu: '',
      verificador_num_tele: '',
      bantotal: { ciu: 'COM-01', cel: '111222333' },
      cius: ['', '', ''],
      cels: [
        { num_tele: '987654321', tipo_tele: '', ope_tele: '', plan_tele: '', whatshap: null },
        { num_tele: '', tipo_tele: '', ope_tele: '', plan_tele: '', whatshap: null },
      ],
    });
  });
});
