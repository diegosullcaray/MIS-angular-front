import type { AuthConfig } from 'angular-oauth2-oidc';
import { environment } from '../../../../../environments/environment';

/** Configuración de Google Sign-In (Implicit Flow). */
export const googleAuthConfig: AuthConfig = {
  issuer: 'https://accounts.google.com',
  redirectUri: environment.redirectUri,
  clientId: environment.googleOAuthClientId,
  scope: 'openid profile email',
  strictDiscoveryDocumentValidation: false,
};
