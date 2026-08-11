import type { RolSlug } from './rol.model';

export interface UsuarioActivo {
  id: string;
  nombre: string;
  email: string;
  rol: RolSlug;
  /** Slugs de Remotes habilitados para este usuario */
  subsistemas: string[];
  avatarUrl?: string;
  /**
   * Código de negocio/agencia (`cod_bt` del `profile` que devuelve el
   * backend Ant en `login_response`) — lo requieren varios módulos de STG
   * migrados al Host (ej. Kaypacha) para identificar al usuario en sus
   * propias rutas del backend.
   */
  codBt?: string;
  /**
   * Fecha de corte de campaña (`profile.curr_fec` del backend Ant, formato `YYYYMMDD`) — la
   * usan los módulos migrados que antes aproximaban con la fecha real (`fechaCorte()` en
   * `IncentivosService`/`PresupuestoService`), lo que podía pedir datos de un día que el
   * backend todavía no cerró/calculó y devolver todo vacío.
   */
  fechaCorte?: string;
  /** Fechas de corte re-consultables (`profile.hab_fec` del backend Ant), separadas por coma, formato `YYYYMMDD` cada una. */
  fechasHabilitadas?: string;
}

export interface MenuItemActivo {
  ruta: string;
  etiqueta: string;
  /** Slug del subsistema activo (undefined = Host principal) */
  subsistema?: string;
}
