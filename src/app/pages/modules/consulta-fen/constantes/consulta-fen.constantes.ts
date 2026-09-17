import type { DataTableColumn } from '../../../../shared/ui/data-table/data-table.model';
import type { ColumnaFiltroFen, ColumnaTextoFen } from '../models/consulta-fen.model';

export const COD_REPORTE_FEN = 'CON_AGRO_FEN';
export const MENSAJE_RIESGO_ALTO_FEN =
  'Zona de Alto Riesgo CENEPRED: Ofrecer Seguro Agrícola / Multirriesgo.';

export interface FiltroFen {
  readonly value: ColumnaFiltroFen;
  readonly label: 'Ubigeo' | 'Departamento' | 'Provincia' | 'Distrito';
  readonly campo?: 'des_dep' | 'des_prov' | 'des_dist';
}

/** Mapeo del selector al parámetro `col` del reporte legado. */
export const FILTROS_FEN: readonly FiltroFen[] = [
  { value: 0, label: 'Ubigeo' },
  { value: 1, label: 'Departamento', campo: 'des_dep' },
  { value: 2, label: 'Provincia', campo: 'des_prov' },
  { value: 3, label: 'Distrito', campo: 'des_dist' },
];

export function campoSugerenciaFen(columna: ColumnaTextoFen): 'des_dep' | 'des_prov' | 'des_dist' {
  return FILTROS_FEN.find((filtro) => filtro.value === columna)?.campo ?? 'des_dist';
}

const NIVELES_RIESGO = ['Muy Alto', 'Alto', 'Medio', 'Bajo', 'Muy Bajo'];

export const COLUMNAS_FEN: DataTableColumn[] = ([
  { field: 'cod_ubi', header: 'UBIGEO', width: '5.5rem', filterType: 'text' },
  { field: 'des_dist', header: 'Distrito', width: '7rem', filterType: 'text' },
  { field: 'des_prov', header: 'Provincia', filterType: 'text', mobileVisible: false },
  { field: 'des_dep', header: 'Departamento', filterType: 'text', mobileVisible: false },
  { field: 'exp_mas', header: 'Mov. en masa', width: '4rem', align: 'center', filterType: 'dropdown' },
  { field: 'exp_inu', header: 'Inundación', width: '4rem', align: 'center', filterType: 'dropdown' },
  { field: 'exp_seq', header: 'Sequía', width: '4rem', align: 'center', filterType: 'dropdown' },
  { field: 'exp_pre', header: 'Predominante', width: '4.5rem', align: 'center', filterType: 'dropdown' },
  { field: 'observacion', header: 'Observación', width: '19rem', sortable: false, mobileVisible: false },
 ] satisfies DataTableColumn[]).map((columna): DataTableColumn =>
  columna.filterType === 'dropdown'
    ? {
        ...columna,
        dropdownOptions: NIVELES_RIESGO.map((nivel) => ({
          label: nivel,
          value: nivel,
        })),
      }
    : columna
);
