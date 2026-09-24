import type { SidebarNavRuta } from '../interfaces/sidebar.model';

export const ACCESO_PANEL_UNIFICADO: SidebarNavRuta = {
  etiqueta: 'Panel unificado del asesor',
  ruta: '/app/analista/panel-unificado',
  icono: 'pi pi-th-large',
};

/** Enriquece únicamente la carpeta Analista ya disponible en el menú de Reportes. */
export function conPanelUnificado(nodos: SidebarNavRuta[]): SidebarNavRuta[] {
  return nodos.map((nodo) => {
    if (!nodo.hijos) return nodo;
    const hijos = conPanelUnificado(nodo.hijos);
    if (
      nodo.etiqueta.trim().toLowerCase() !== 'analista' ||
      hijos.some((hijo) => hijo.ruta === ACCESO_PANEL_UNIFICADO.ruta)
    ) {
      return { ...nodo, hijos };
    }
    return { ...nodo, hijos: [{ ...ACCESO_PANEL_UNIFICADO }, ...hijos] };
  });
}
