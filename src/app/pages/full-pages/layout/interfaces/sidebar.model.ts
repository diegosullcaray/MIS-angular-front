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

/**
 * Un nodo de la navegación aplanado, con su sistema y su ubicación resueltos.
 * Es lo que indexa el buscador: el árbol de menús se recorre entero —todos los
 * sistemas, a cualquier profundidad— para poder encontrar un reporte sin saber
 * en qué carpeta vive (ver `NavegacionSistemasService.registros`).
 */
export interface RegistroNavegacion {
  /** Identidad estable dentro del árbol: sistema + cadena de carpetas + etiqueta. */
  id: string;
  etiqueta: string;
  /** Título del sistema que lo contiene. Se usa como faceta. */
  sistema: string;
  sistemaId: string;
  /** Faceta: las hojas abren una pantalla, las ramas se navegan. */
  tipo: 'Reporte' | 'Carpeta';
  /** Destino de la hoja; las carpetas no tienen. */
  ruta?: string;
  icono?: string;
  /** Carpetas ANTECESORAS (sin incluir el propio nodo), para reabrir el explorador. */
  carpetas: SidebarNavRuta[];
  /** El nodo original, para poder entrar en él si es carpeta. */
  nodo: SidebarNavRuta;
  /** Ubicación legible: `Reportes › Avance Comercial`. */
  ubicacion: string;
}