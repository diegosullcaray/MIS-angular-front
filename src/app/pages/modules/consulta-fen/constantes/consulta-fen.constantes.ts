import type { DataTableColumn } from '../../../../shared/ui/data-table/data-table.model';

export const COD_REPORTE_FEN = 'CON_AGRO_FEN';
export const FECHA_MATRIZ_FEN = '12 set. 2026';
export const MENSAJE_RIESGO_ALTO_FEN =
  'Zona de Alto Riesgo CENEPRED: Ofrecer Seguro Agrícola / Multirriesgo.';

const NIVELES_RIESGO = ['Muy Alto', 'Alto', 'Medio', 'Bajo', 'Muy Bajo'];

export const COLUMNAS_FEN: DataTableColumn[] = ([
  { field: 'seleccion', header: 'Ubicar', width: '4.5rem', align: 'center', sortable: false },
  { field: 'cod_ubi', header: 'UBIGEO', width: '7rem', filterType: 'text' },
  { field: 'des_dist', header: 'Distrito', filterType: 'text' },
  { field: 'des_prov', header: 'Provincia', filterType: 'text', mobileVisible: false },
  { field: 'des_dep', header: 'Departamento', filterType: 'text', mobileVisible: false },
  { field: 'exp_mas', header: 'Mov. en masa', align: 'center', filterType: 'dropdown', mobileVisible: false },
  { field: 'exp_inu', header: 'Inundación', align: 'center', filterType: 'dropdown', mobileVisible: false },
  { field: 'exp_seq', header: 'Sequía', align: 'center', filterType: 'dropdown', mobileVisible: false },
  { field: 'exp_pre', header: 'Predominante', align: 'center', filterType: 'dropdown' },
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
