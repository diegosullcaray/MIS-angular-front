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
export { Strand } from './strand.class';
export { CypherService } from './cypher.service';
export { RESTService } from './rest.service';
export { RESTPacket } from './rest-packet.class';
export { WinderService } from './winder.service';
export { AntService } from './ant-service.class';
export type { IWinderResponse, IWinderConnectionConf, IWinderRequestConfig } from './winder.interface';

// Instancias de módulos de negocio
export { ModSysLoginService } from './instances/mod-sys-login.service';
export { ModSysAdminService } from './instances/mod-sys-admin.service';
