/** Un ítem de la lista CIIU (`SEL_CIU_02`) — sector económico → giros de negocio asociados. */
export interface CiiuOpcion {
  sec_eco: string;
  id: string;
  desc: string;
}

/** Modelo del formulario de encuesta (Signal Forms) — mismas preguntas y `variable`s del legado `crs-cap-ret.component.ts`. */
export interface EncuestaClienteForm {
  afecNeg: string;
  funNeg: string;
  sitNeg: string;
  secEco: string;
  redNeg: string;
  girNeg: string;
}

export const ENCUESTA_CLIENTE_FORM_VACIO: EncuestaClienteForm = {
  afecNeg: '',
  funNeg: '',
  sitNeg: '',
  secEco: '',
  redNeg: '',
  girNeg: '',
};

/**
 * El legado guarda/lee `reaccion` con las `variable` originales del
 * `FormGroup` (`afec_neg`/`fun_neg`/`sit_neg`/`sec_eco`/`red_neg`/`gir_neg`,
 * snake_case) como un string JSON en la fila del cliente — no camelCase como
 * el modelo de acá. Estos mapeos evitan que se guarde/lea con las claves
 * equivocadas.
 */
export function formularioAJson(form: EncuestaClienteForm): Record<string, string> {
  return {
    afec_neg: form.afecNeg,
    fun_neg: form.funNeg,
    sit_neg: form.sitNeg,
    sec_eco: form.secEco,
    red_neg: form.redNeg,
    gir_neg: form.girNeg,
  };
}

/** Inverso de `formularioAJson()` — para precargar la encuesta si el cliente ya la había respondido antes (legado `update()`: `JSON.parse(r.row.reaccion)`). */
export function jsonAFormulario(json: unknown): EncuestaClienteForm {
  const r = (json ?? {}) as Record<string, unknown>;
  return {
    afecNeg: (r['afec_neg'] as string) ?? '',
    funNeg: (r['fun_neg'] as string) ?? '',
    sitNeg: (r['sit_neg'] as string) ?? '',
    secEco: (r['sec_eco'] as string) ?? '',
    redNeg: (r['red_neg'] as string) ?? '',
    girNeg: (r['gir_neg'] as string) ?? '',
  };
}

export interface OpcionEncuesta {
  id: string;
  desc: string;
}

/** "¿Se ha visto afectado por el estado de emergencia establecido por el COVID-19?" */
export const OPCIONES_AFEC_NEG: OpcionEncuesta[] = [
  { id: 'Total', desc: 'Total' },
  { id: 'Parcial', desc: 'Parcial' },
  { id: 'Ninguno', desc: 'Ninguno' },
];

/** "¿Actualmente su negocio está funcionando?" */
export const OPCIONES_FUN_NEG: OpcionEncuesta[] = [
  { id: 'Si', desc: 'Si' },
  { id: 'Cambio Giro', desc: 'Cambio Giro' },
  { id: 'No presenta Negocio', desc: 'No presenta Negocio' },
];

/** "Situación de su nivel de ventas/Ingresos después de la declaratoria de emergencia?" */
export const OPCIONES_SIT_NEG: OpcionEncuesta[] = [
  { id: 'Son más altos', desc: 'Son más altos' },
  { id: 'Se mantiene igual', desc: 'Se mantiene igual' },
  { id: 'Se redujo', desc: 'Se redujo' },
];

/** "¿En qué % se redujo su nivel de ventas?" */
export const OPCIONES_RED_NEG: OpcionEncuesta[] = [
  { id: '0 -10%', desc: '0 -10%' },
  { id: '11% - 20%', desc: '11% - 20%' },
  { id: '21% -30%', desc: '21% -30%' },
  { id: '31% - 40%', desc: '31% - 40%' },
  { id: '41% - 50%', desc: '41% - 50%' },
  { id: '51% - 60%', desc: '51% - 60%' },
  { id: '61% - 70%', desc: '61% - 70%' },
  { id: '71% - 80%', desc: '71% - 80%' },
  { id: '81% - 90%', desc: '81% - 90%' },
  { id: '> 90%', desc: '> 90%' },
];

/** "Seleccione Sector Económico:" */
export const OPCIONES_SEC_ECO: OpcionEncuesta[] = [
  { id: 'COMERCIO', desc: 'Comercio' },
  { id: 'PRODUCCION', desc: 'Producción' },
  { id: 'SERVICIO', desc: 'Servicio' },
  { id: 'AGRICOLA', desc: 'Agrícola' },
];
