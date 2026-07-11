export type SidebarIconType = 'host-inicio' | 'remote';

export interface SidebarIcon {
  id: string;
  tipo: SidebarIconType;
  icono: string;
  etiqueta: string;
  ruta?: string;
  tienePanel: boolean;
}

export interface SidebarNavPanelConfig {
  tipo: 'host-admin' | 'host-usuario' | 'remote';
  titulo: string;
  icono: string;
  secciones: SidebarNavSeccion[];
}

export interface SidebarNavSeccion {
  titulo?: string;
  rutas: SidebarNavRuta[];
}

export interface SidebarNavRuta {
  etiqueta: string;
  ruta: string;
  icono?: string;
  soloAdmin?: boolean;
  soloAdminSistema?: boolean;
}

export interface SubsistemaManifest {
  id: string;
  nombre: string;
  icono: string;
  remoteEntry: string;
  navPanel: SidebarNavPanelConfig;
}
