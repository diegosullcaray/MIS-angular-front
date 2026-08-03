import type { AuthConfig } from 'angular-oauth2-oidc';
import { environment } from '../../../../../environments/environment';

/**
 * Configuración de Google Sign-In (Implicit Flow).
 *
 * Mismo `clientId` y flujo que STG (stg-app-mis-r22/src/app/pages/full-pages/auth/services/gmail.config.ts) —
 * el proyecto OAuth en Google Cloud ya está registrado para este `redirectUri`.
 */
export const googleAuthConfig: AuthConfig = {
  issuer: 'https://accounts.google.com',
  redirectUri: environment.redirectUri,
  clientId: environment.googleOAuthClientId,
  scope: 'openid profile email',
  strictDiscoveryDocumentValidation: false,
};
