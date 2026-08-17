import type { Environment } from './environment.model';

/**
 * Configuración de PRODUCCIÓN, inyectada por `fileReplacements`.
 * No declares `devUser` acá: su ausencia es la barrera que impide que una
 * identidad de prueba llegue a producción.
 */
export const environment: Environment = {
  production: true,

  cypherSecret: '85A99A2F37313C9B921BCC827AB7FC67',
  moduleSecrets: {
    session: '8A9ABC5A76E1A86B26402C32DD355394',
    app: 'CCAFE0F473E9B66F2EA57D46C5C3047E',
    admin: '29A832E1F8C68ECB46E7C89716BB68E2',
    secciones: 'D4305E5943A377227C6BF78C8E3278AD',
    reporting: 'B0ECE459601D3577F7408D5C8DEA314A',
  },

  requestConfigRootURL: 'https://stg.confianza.pe/cores2/ant',

  redirectUri: 'https://stg.confianza.pe/login',
  googleOAuthClientId: '690217690558-7l16jg0u9r7udt2jjp6tjmtd3mhkgihu.apps.googleusercontent.com',

  externalLinks: {
    imparables:
      'https://sites.google.com/confianza.pe/imparables/p%C3%A1gina-principal?authuser=1&read_current=1',
    jira: 'https://jira.tecnologiafm.org/servicedesk/customer/user/login?destination=portal%2F15&logout=true',
    helpdesk: 'https://sites.google.com/confianza.pe/helpdeskconfianza/index?pli=1&authuser=2',
  },
};
