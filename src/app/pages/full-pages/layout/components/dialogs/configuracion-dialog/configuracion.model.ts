/** Estructura del menú de configuración — equivalente tipado del `menu-config.json` de la plantilla (`docs/08-otros/dialog-configuracion`), que ahí se leía por HTTP a través de un `MenuConfigService`. */

/** Pantallas de configuración que ya tienen controles reales detrás. */
export type PanelConfiguracion = 'apariencia' | 'estructura' | 'anuncios';

/** Hoja del menú: una pantalla concreta de configuración. */
export interface ItemConfiguracion {
  readonly clave: string;
  readonly etiqueta: string;
  /** Clase de PrimeIcons (`pi pi-...`). */
  readonly icono: string;
  readonly descripcion: string;
  /** Pantalla real del ajuste. Sin ella, el item todavía es una maqueta. */
  readonly panel?: PanelConfiguracion;
  /** Ajustes de muestra que se dibujan mientras la pantalla real no existe. Cada item que estrena su `panel` deja de necesitarlos. */
  readonly ejemplos?: readonly string[];
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
        descripcion: 'Modo claro u oscuro, fondo del escritorio y color de acento.',
        panel: 'apariencia',
      },
      {
        clave: 'estructura',
        etiqueta: 'Estructura',
        icono: 'pi pi-bars',
        descripcion: 'Cómo se comporta el menú de sistemas y con qué vista abre el explorador.',
        panel: 'estructura',
      },
      {
        clave: 'anuncios',
        etiqueta: 'Anuncios',
        icono: 'pi pi-megaphone',
        descripcion: 'Los comunicados que aparecen al entrar: cuándo se muestran y cuáles se publicaron.',
        panel: 'anuncios',
      },
      {
        clave: 'notificaciones',
        etiqueta: 'Notificaciones',
        icono: 'pi pi-bell',
        descripcion: 'Los avisos que genera el sistema por tu actividad: qué recibís y por qué canal.',
        ejemplos: ['Avisos dentro del sistema', 'Resumen por correo', 'Alertas de reportes programados'],
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
