export type SidebarIconType = 'host-inicio' | 'host-modulo' | 'remote';

/** Ícono del menú principal (Col 1). */
export interface SidebarIcon {
  id: string;
  tipo: SidebarIconType;
  icono: string;
  etiqueta: string;
  /** Ruta de navegación directa (aplica si no tiene panel). */
  ruta?: string;
  tienePanel: boolean;
}

/** Configuración del panel secundario (Col 2). */
export interface SidebarNavPanelConfig {
  tipo: 'host-admin' | 'remote';
  titulo: string;
  icono: string;
  secciones: SidebarNavSeccion[];
}

/** Sección agrupadora dentro del panel. */
export interface SidebarNavSeccion {
  titulo?: string;
  rutas: SidebarNavRuta[];
}

export interface SidebarNavRuta {
  etiqueta: string;
  /** Opcional. Si se omite, el nodo actúa como un grupo desplegable. */
  ruta?: string;
  icono?: string;
  soloAdmin?: boolean;
  soloAdminSistema?: boolean;
  /** Subrutas anidadas. */
  hijos?: SidebarNavRuta[];
}