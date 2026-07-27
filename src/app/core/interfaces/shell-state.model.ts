import type { RolSlug } from '../../pages/modules/admin/roles/models/rol.model';

export interface UsuarioActivo {
  id: string;
  nombre: string;
  email: string;
  rol: RolSlug;
  /** Slugs de Remotes habilitados para este usuario */
  subsistemas: string[];
  avatarUrl?: string;
}

export interface MenuItemActivo {
  ruta: string;
  etiqueta: string;
  /** Slug del subsistema activo (undefined = Host principal) */
  subsistema?: string;
}
