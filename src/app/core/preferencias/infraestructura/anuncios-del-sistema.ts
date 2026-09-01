import { APP_VERSION } from '../../../app.global';
import type { Anuncio } from '../dominio/anuncio.model';

/**
 * Catálogo de anuncios que hoy publica el Host. Es la implementación del token
 * `CATALOGO_ANUNCIOS`: una constante mientras no exista el endpoint que los
 * administre. Sustituirla por un servicio remoto es cambiar el `provide` en
 * `app.config.ts`; ni el caso de uso ni el diálogo cambian.
 *
 * Reglas para editar esta lista:
 *  - El `id` es la identidad anti-spam. Un anuncio ya cerrado por el usuario no
 *    vuelve a aparecer, así que corregir una errata NO exige un id nuevo;
 *    cambiar el mensaje para que todos lo vuelvan a ver, sí (`...-v2`).
 *  - `vigenteHasta` es para lo que caduca (una ventana de mantenimiento);
 *    sin él, el anuncio queda disponible en el historial para siempre.
 *  - `fijo` reaparece en cada inicio de sesión aunque se cierre: se reserva
 *    para avisos que tienen que estar delante del usuario mientras duren.
 */
export const ANUNCIOS_DEL_SISTEMA: readonly Anuncio[] = [
  {
    id: 'preferencias-2026-09',
    titulo: 'Ahora podés configurar el aspecto del sistema',
    cuerpo:
      'En tu menú de usuario, en Configuración → Apariencia, podés elegir el fondo del escritorio ' +
      '(foto, color plano o degradado), un color propio y el color de acento. En Estructura elegís ' +
      'cómo se comporta el menú de sistemas: estático, delgado, superpuesto u horizontal. ' +
      'Todo queda guardado en este equipo y se borra al cerrar sesión.',
    severidad: 'novedad',
    fecha: '2026-09-01',
  },
  {
    id: `anuncios-una-sola-vez-${APP_VERSION}`,
    titulo: 'Los anuncios ya no se repiten en cada inicio de sesión',
    cuerpo:
      'Este aviso se muestra una sola vez: al cerrarlo queda marcado como leído y no vuelve a ' +
      'aparecer. Podés releer los anuncios cuando quieras desde Configuración → Anuncios, o ' +
      'apagarlos por completo desde ahí mismo.',
    severidad: 'info',
    fecha: '2026-09-01',
  },
] as const;
