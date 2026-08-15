/** Un ítem de la jerarquía geográfica/organizacional (`SEL_JER_01`) — agencias, territorios, corredores, departamentos, provincias, distritos y CIIU, todos en la misma lista, distinguidos por `sec_eco`. */
export interface OpcionJerarquia {
  id: string;
  desc: string;
  sec_eco: string;
}

export interface OpcionProspecto {
  id: string;
  desc: string;
}

/**
 * Formulario "Registro Prospecto" (diálogo "Nuevo" de `crs-prospe`,
 * `add-prospe.component.ts`) — solo los campos realmente visibles en el
 * legado. No se migran los campos envueltos en `[hidden]="isHidden"`
 * (`HAPERTCTA`, `HESTDCORE`, `HMESINST`, `HINSTALAD`, `HFECINSTAL`, `HZONA`,
 * `HPROSPEC`, `HFIRMADN`, `HVINFAMI`, `HTIPVINC`, `HIDCORRES`): `isHidden`
 * arranca en `true` y ningún método del componente lo cambia — quedan
 * ocultos siempre, código muerto.
 */
export interface ProspectoCorresponsalForm {
  HAPENOMB: string;
  HNUMDOC: string;
  HNUMRUC: string;
  HCELULAR: string;
  HDCIIU: string;
  HDIREC: string;
  HDEPA: string;
  HPROV: string;
  HDISTR: string;
  HDESTER: string;
  HDESCOR: string;
  HDESAGE: string;
  HGEOLATI: string;
  HGEOLON: string;
  HNOMCOM: string;
  HTIPAGENT: string;
  HTAPERCC: string;
  HCONSRUC: string;
  HCONSRCC: string;
  HCONSLNE: string;
  HFOTNEGO: string;
  HCTALICEF: string;
  /** Solo requerido si `HCTALICEF === 'SI'` — legado `ctaLicenciaF.valueChanges`. */
  HLICFUNCI: string;
  HCANACAP: string;
  HCODSECASIG: string;
  HASEASIG: string;
}

export const PROSPECTO_CORRESPONSAL_FORM_VACIO: ProspectoCorresponsalForm = {
  HAPENOMB: '',
  HNUMDOC: '',
  HNUMRUC: '',
  HCELULAR: '',
  HDCIIU: '',
  HDIREC: '',
  HDEPA: '',
  HPROV: '',
  HDISTR: '',
  HDESTER: '',
  HDESCOR: '',
  HDESAGE: '',
  HGEOLATI: '',
  HGEOLON: '',
  HNOMCOM: '',
  HTIPAGENT: '',
  HTAPERCC: '',
  HCONSRUC: '',
  HCONSRCC: '',
  HCONSLNE: '',
  HFOTNEGO: '',
  HCTALICEF: '',
  HLICFUNCI: '',
  HCANACAP: '',
  HCODSECASIG: '',
  HASEASIG: '',
};

export const OPCIONES_TIPO_AGENTE: OpcionProspecto[] = [
  { id: 'Agente Confianza', desc: 'Agente Confianza' },
  { id: 'Agente Satelital', desc: 'Agente Satelital' },
  { id: 'Tambillo', desc: 'Tambillo' },
];

export const OPCIONES_CTA_LICENCIA: OpcionProspecto[] = [
  { id: 'SI', desc: 'SI' },
  { id: 'NO', desc: 'NO' },
];

export const OPCIONES_CANAL_CAPTACION: OpcionProspecto[] = [
  { id: ' Financiera Confianza', desc: ' Financiera Confianza' },
  { id: 'Woccu', desc: 'Woccu' },
  { id: 'Alianza Cacao', desc: 'Alianza Cacao' },
];

/** Payload real que espera `ADD_PROS_CORRE_01` — legado `save()`: `{HCODSEC: cod_bt, ...formG.getRawValue()}`, enviado como `json` (string). */
export function formularioAPayload(form: ProspectoCorresponsalForm, codBt: string): Record<string, string> {
  return { HCODSEC: codBt, ...form };
}
