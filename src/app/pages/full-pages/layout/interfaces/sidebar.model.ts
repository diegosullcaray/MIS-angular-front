export type SidebarIconType = 'host-inicio' | 'remote';

/** Ícono de la Col 1 (rail angosto) — selecciona qué panel mostrar en la Col 2. */
export interface SidebarIcon {
  id: string;
  tipo: SidebarIconType;
  icono: string;
  etiqueta: string;
  /** Presente cuando el ícono no tiene panel propio: navega directo al hacer clic. */
  ruta?: string;
  tienePanel: boolean;
}

/** Panel de la Col 2 para el ícono seleccionado. */
export interface SidebarNavPanelConfig {
  tipo: 'host-admin' | 'remote';
  titulo: string;
  icono: string;
  secciones: SidebarNavSeccion[];
}

/** Sección colapsable del panel (chevron ▾ igual que "Espacios"/"GOOGLE" en Gmail/Chat). */
export interface SidebarNavSeccion {
  titulo?: string;
  rutas: SidebarNavRuta[];
}

export interface SidebarNavRuta {
  etiqueta: string;
  /** Ausente cuando el nodo es un grupo (tiene `hijos`): no navega, solo expande/colapsa. */
  ruta?: string;
  icono?: string;
  soloAdmin?: boolean;
  soloAdminSistema?: boolean;
  /** Nodos de nivel N+1 (árbol de STG, profundidad arbitraria). */
  hijos?: SidebarNavRuta[];
}
