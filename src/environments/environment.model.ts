/** Contrato de configuración por entorno. Tipar ambos archivos con esta interfaz impide que vuelvan a divergir sin que el compilador lo note. */
export interface Environment {
  production: boolean;

  /** Clave AES-128 del protocolo Winder — hex de 32 caracteres. */
  cypherSecret: string;

  /** Secreto por módulo del backend Ant, indexado por `appId`. */
  moduleSecrets: {
    session: string;
    app: string;
    admin: string;
    secciones: string;
    reporting: string;
    /** Módulo de reportes v2 (puerto 6304) — lo usa "Monitor Salidas y Retenciones". */
    rep2: string;
  };

  /** Raíz del backend Ant, ej. `https://stg.confianza.pe/cores2/ant`. */
  requestConfigRootURL: string;

  /** Debe estar registrado en Google Cloud. */
  redirectUri: string;

  googleOAuthClientId: string;

  /** `RedirectOverlayService` los resuelve por nombre: las tres claves son obligatorias. */
  externalLinks: {
    imparables: string;
    jira: string;
    helpdesk: string;
  };

  /** Solo desarrollo. Ausente en producción; `AuthService` lo lee bajo `isDevMode()`. */
  devUser?: string;
}
