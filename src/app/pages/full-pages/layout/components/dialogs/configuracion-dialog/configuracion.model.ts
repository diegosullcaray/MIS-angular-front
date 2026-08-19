/**
 * Estructura del menú de configuración — equivalente tipado del `menu-config.json`
 * de la plantilla (`docs/08-otros/dialog-configuracion`), que ahí se leía por
 * HTTP a través de un `MenuConfigService`.
 *
 * Acá vive como constante: el árbol es fijo, no depende del backend y así el
 * diálogo no necesita esperar una request para pintar la primera sección.
 */

/** Hoja del menú: una pantalla concreta de configuración. */
export interface ItemConfiguracion {
  readonly clave: string;
  readonly etiqueta: string;
  /** Clase de PrimeIcons (`pi pi-...`). */
  readonly icono: string;
  readonly descripcion: string;
  /**
   * Ajustes de muestra que se dibujan mientras la pantalla real no existe.
   * Cuando cada item tenga su propio componente, esta lista desaparece.
   */
  readonly ejemplos: readonly string[];
}

/** Agrupador de primer nivel (Col 1 del diálogo). */
export interface SeccionConfiguracion {
  readonly clave: string;
  readonly etiqueta: string;
  readonly icono: string;
  readonly items: readonly ItemConfiguracion[];
}

export const SECCIONES_CONFIGURACION: readonly SeccionConfiguracion[] = [
  {
    clave: 'cuenta',
    etiqueta: 'Cuenta',
    icono: 'pi pi-user',
    items: [
      {
        clave: 'perfil',
        etiqueta: 'Información general',
        icono: 'pi pi-user',
        descripcion: 'Tus datos personales y cómo te ve el resto de la organización.',
        ejemplos: ['Nombre y apellidos', 'Correo corporativo', 'Cargo y agencia'],
      },
    ],
  },
  {
    clave: 'general',
    etiqueta: 'General',
    icono: 'pi pi-cog',
    items: [
      {
        clave: 'idioma',
        etiqueta: 'Idioma y zona horaria',
        icono: 'pi pi-clock',
        descripcion: 'Idioma de la interfaz y huso horario con el que se fechan los reportes.',
        ejemplos: ['Idioma de la interfaz', 'Zona horaria', 'Formato de fecha'],
      },
      {
        clave: 'apariencia',
        etiqueta: 'Apariencia',
        icono: 'pi pi-palette',
        descripcion: 'Modo claro u oscuro, color de acento y fondo del escritorio.',
        ejemplos: ['Modo de visualización', 'Color de acento', 'Imagen de fondo'],
      },
      {
        clave: 'estructura',
        etiqueta: 'Estructura',
        icono: 'pi pi-bars',
        descripcion: 'Cómo se ordenan el rail de sistemas y el explorador.',
        ejemplos: ['Orden de los sistemas', 'Vista por defecto del explorador'],
      },
      {
        clave: 'notificaciones',
        etiqueta: 'Notificaciones',
        icono: 'pi pi-bell',
        descripcion: 'Qué avisos recibes y por qué canal.',
        ejemplos: ['Avisos dentro del sistema', 'Resumen por correo'],
      },
      {
        clave: 'preferencias',
        etiqueta: 'Preferencias',
        icono: 'pi pi-eye',
        descripcion: 'Detalles de uso diario que se recuerdan entre sesiones.',
        ejemplos: ['Pantalla de inicio', 'Filas por página', 'Recordar últimos filtros'],
      },
    ],
  },
  {
    clave: 'seguridad',
    etiqueta: 'Seguridad',
    icono: 'pi pi-shield',
    items: [
      {
        clave: 'sesiones',
        etiqueta: 'Sesiones activas',
        icono: 'pi pi-list',
        descripcion: 'Dispositivos donde tu cuenta tiene la sesión abierta.',
        ejemplos: ['Este dispositivo', 'Cerrar las demás sesiones'],
      },
      {
        clave: 'mfa',
        etiqueta: 'Autenticación de dos factores',
        icono: 'pi pi-lock',
        descripcion: 'Un segundo factor además de la contraseña al iniciar sesión.',
        ejemplos: ['Aplicación de autenticación', 'Códigos de respaldo'],
      },
    ],
  },
  {
    clave: 'contactos',
    etiqueta: 'Contactos',
    icono: 'pi pi-users',
    items: [
      {
        clave: 'lista-contactos',
        etiqueta: 'Lista de contactos',
        icono: 'pi pi-book',
        descripcion: 'Personas con las que compartes reportes con frecuencia.',
        ejemplos: ['Contactos guardados', 'Agregar contacto'],
      },
      {
        clave: 'grupos',
        etiqueta: 'Grupos',
        icono: 'pi pi-warehouse',
        descripcion: 'Conjuntos de contactos para compartir de una sola vez.',
        ejemplos: ['Grupos creados', 'Nuevo grupo'],
      },
    ],
  },
] as const;
