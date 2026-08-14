export interface OpcionDato<T = string> {
  id: T;
  desc: string;
}

/** Un teléfono del cliente — mismas `variable` del legado (`this.form` de `crs-cli-act.component.ts`). */
export interface CelForm {
  numTele: string;
  tipoTele: string;
  opeTele: string;
  planTele: string;
  whatshap: boolean | null;
}

export function celVacio(): CelForm {
  return { numTele: '', tipoTele: '', opeTele: '', planTele: '', whatshap: null };
}

/**
 * Modelo del formulario "Actualizar Datos". El legado usa 2 `FormArray`
 * (`cels`/`cius`), pero de tamaño fijo — `addCels()` solo se llama 2 veces y
 * el botón para agregar más está comentado/muerto en el `.html` — así que acá
 * son tuplas de tamaño fijo, sin necesidad de un array dinámico real.
 */
export interface DatosClienteForm {
  email: string;
  verificadorNumTele: string;
  verificadorCiiu: string;
  cels: [CelForm, CelForm];
  cius: [string, string, string];
}

export const DATOS_CLIENTE_FORM_VACIO: DatosClienteForm = {
  email: '',
  verificadorNumTele: '',
  verificadorCiiu: '',
  cels: [celVacio(), celVacio()],
  cius: ['', '', ''],
};

/** Teléfono/CIIU ya registrados en BanTotal (`num_tele_0`/`ciiu_0_id` de la fila del cliente) — solo lectura, referencia para el sectorista. */
export interface ReferenciaBantotal {
  cel: string;
  ciu: string;
}

export const REFERENCIA_BANTOTAL_VACIA: ReferenciaBantotal = { cel: '', ciu: '' };

/** Regex del legado (`Validators.pattern`) para validar `# Teléfono` — vacío es válido (opcional), solo se valida si hay algo escrito. */
export const PATRON_NUM_TELE = /^(?!0+$)(?:\(?\+\d{1,3}\)?[- ]?|0)?\d{7,9}$/;

export const OPCIONES_TIPO_TELE: OpcionDato[] = [
  { id: 'SMARTPHONE', desc: 'SMARTPHONE' },
  { id: 'CELULAR SIMPLE', desc: 'CELULAR SIMPLE' },
  { id: 'TELEFONO FIJO', desc: 'TELÉFONO FIJO' },
  { id: 'SIN CELULAR', desc: 'SIN CELULAR' },
];

export const OPCIONES_OPE_TELE: OpcionDato[] = [
  { id: 'Claro', desc: 'Claro' },
  { id: 'Movistar', desc: 'Movistar' },
  { id: 'Entel', desc: 'Entel' },
  { id: 'Bitel', desc: 'Bitel' },
  { id: 'Otros', desc: 'Otros' },
];

export const OPCIONES_PLAN_TELE: OpcionDato[] = [
  { id: 'Prepago', desc: 'Prepago' },
  { id: 'PostPago', desc: 'PostPago' },
];

export const OPCIONES_WHATSAPP: OpcionDato<boolean>[] = [
  { id: true, desc: 'SI' },
  { id: false, desc: 'NO' },
];

export const OPCIONES_VERIFICADOR_TELE: OpcionDato[] = [
  { id: 'OK', desc: 'OK' },
  { id: 'NO OK', desc: 'NO OK' },
  { id: 'No tiene teléfono', desc: 'No tiene teléfono' },
  { id: 'No Ubicable', desc: 'No Ubicable' },
];

export const OPCIONES_VERIFICADOR_CIIU: OpcionDato[] = [
  { id: 'OK', desc: 'OK' },
  { id: 'NO OK', desc: 'NO OK' },
];

/**
 * El legado guarda/lee con las claves snake_case originales del `FormGroup`
 * (`formG.getRawValue()`), no camelCase. `referencia` (`bantotal.ciu/cel`) va
 * incluida tal cual en el payload, aunque sea de solo lectura — así lo manda
 * el legado (`getRawValue()` incluye los controles `disabled`).
 */
export function formularioAJson(form: DatosClienteForm, referencia: ReferenciaBantotal): Record<string, unknown> {
  return {
    email: form.email,
    verificador_ciiu: form.verificadorCiiu,
    verificador_num_tele: form.verificadorNumTele,
    bantotal: { ciu: referencia.ciu, cel: referencia.cel },
    cius: form.cius,
    cels: form.cels.map((c) => ({
      num_tele: c.numTele,
      tipo_tele: c.tipoTele,
      ope_tele: c.opeTele,
      plan_tele: c.planTele,
      whatshap: c.whatshap,
    })),
  };
}

/** Precarga el formulario desde una fila de cliente ya con datos (legado `update()`: `email`/`ver_ciiu`/`ver_num_tele`/`cels`/`cius`, estos 2 últimos como string JSON). */
export function filaAFormulario(fila: Record<string, unknown>): DatosClienteForm {
  const cels = parsearJsonArray(fila['cels']);
  const cius = parsearJsonArray(fila['cius']);
  const cel = (indice: number): CelForm => {
    const c = cels[indice] as Record<string, unknown> | undefined;
    if (!c) return celVacio();
    return {
      numTele: (c['num_tele'] as string) ?? '',
      tipoTele: (c['tipo_tele'] as string) ?? '',
      opeTele: (c['ope_tele'] as string) ?? '',
      planTele: (c['plan_tele'] as string) ?? '',
      whatshap: typeof c['whatshap'] === 'boolean' ? c['whatshap'] : null,
    };
  };
  return {
    email: (fila['email'] as string) ?? '',
    verificadorNumTele: (fila['ver_num_tele'] as string) ?? '',
    verificadorCiiu: (fila['ver_ciiu'] as string) ?? '',
    cels: [cel(0), cel(1)],
    cius: [(cius[0] as string) ?? '', (cius[1] as string) ?? '', (cius[2] as string) ?? ''],
  };
}

/** La referencia BanTotal (teléfono/CIIU ya registrados) vive en las columnas `num_tele_0`/`ciiu_0_id` de la fila. */
export function filaAReferencia(fila: Record<string, unknown>): ReferenciaBantotal {
  return { cel: (fila['num_tele_0'] as string) ?? '', ciu: (fila['ciiu_0_id'] as string) ?? '' };
}

function parsearJsonArray(valor: unknown): unknown[] {
  if (typeof valor !== 'string') return [];
  try {
    const parsed = JSON.parse(valor);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
