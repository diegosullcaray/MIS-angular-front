// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  structure: 'corredor',
  devTracing: false,
  devAd: false,
  ipProvider: 'http://api.ipify.org/?format=json',
  cypherSecret: '85A99A2F37313C9B921BCC827AB7FC67',
  moduleSecrets: {
    session: '8A9ABC5A76E1A86B26402C32DD355394',
    app: 'CCAFE0F473E9B66F2EA57D46C5C3047E',
    sis: 'AF2D32E4D26CCDCCE753ABA562C41D67',
    admin: '29A832E1F8C68ECB46E7C89716BB68E2',
    secciones: 'D4305E5943A377227C6BF78C8E3278AD',
    reporting: 'B0ECE459601D3577F7408D5C8DEA314A',
    rep2: '8982D9BA889F825E1360E0C594653C68',
  },
  rootPage: '/session/signin',
  rootDomain: 'http://localhost:4200',
  homePage: '/app/desktop',
  redirectUri: 'http://localhost:4200/login',
  googleOAuthClientId: '690217690558-7l16jg0u9r7udt2jjp6tjmtd3mhkgihu.apps.googleusercontent.com',
  requestConfigRootURL: 'https://stg.confianza.pe/cores2/ant',
  //requestConfigRootURL:'http://localhost:8080/ant',

  externalLinks: {
    imparables: 'https://sites.google.com/confianza.pe/imparables/p%C3%A1gina-principal?authuser=1&read_current=1',
    helpdesk: 'https://sites.google.com/confianza.pe/helpdeskconfianza/index?pli=1&authuser=2',
    jira: 'https://jira.tecnologiafm.org/servicedesk/customer/user/login?destination=portal%2F15&logout=true',
  },

  //devUser:  'nilda.quilla@confianza.pe' // comercial
  //devUser:  'giomara.acevedo@confianza.pe' //operaciones  157
  //devUser: 'flor.garcia@confianza.pe' // asesor
  devUser: 'oscar.sanchez@confianza.pe'
};

