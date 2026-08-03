/**
 * Barrel de la capa Winder/Ant.
 *
 * Exporta todo lo necesario para que los módulos de negocio
 * importen desde un único punto:
 *
 * ```typescript
 * import { AntService, Strand, IWinderResponse } from '@core/winder';
 * ```
 */
export { Strand } from './winder/strand.class';
export { CypherService } from '../services/cypher.service';
export { RESTService } from './rest/rest.service';
export { RESTPacket } from './rest/rest-packet.class';
export { WinderService } from './winder/winder.service';
export { AntService } from './ant/ant-service.class';
export type { IWinderResponse, IWinderConnectionConf, IWinderRequestConfig } from './winder/winder.interface';

// Instancias de módulos de negocio
export { ModSysLoginService } from './instances/mod-sys-login.service';
export { ModSysAdminService } from './instances/mod-sys-admin.service';
