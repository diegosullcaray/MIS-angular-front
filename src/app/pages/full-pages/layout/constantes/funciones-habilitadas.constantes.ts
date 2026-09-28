/**
 * Funciones del shell que se pueden apagar sin borrar su código.
 *
 * Con `configuracion: false` desaparece la opción "Configuración" del menú del perfil, su
 * diálogo no se monta y la novedad que guía hasta ahí ("Personaliza tu espacio de trabajo")
 * deja de listarse. Para reactivarla basta volver a `true`.
 */
export const FUNCIONES_HABILITADAS = {
  configuracion: false,
} as const;
