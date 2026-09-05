export interface LoginResponseBody {
    login_response?: {
        profile?: PerfilRaw;
        /** Usuarios a los que este usuario está autorizado a cambiarse (ver `AdminService.openAltUserDialog` en STG). */
        alternates?: AlternateRaw[];
        /** Token/ID de sesión que Winder emite tras un login exitoso. */
        sid?: string;
        token?: string;
    };
}

export interface PerfilRaw {
    email?: string;
    nombre?: string;
    /** Código de negocio/agencia — lo requieren varios módulos de STG (ej. Kaypacha). */
    cod_bt?: string;
    /** Tipo de usuario: 0 = administrador. STG no tiene una jerarquía de 3 niveles. */
    tip_use?: number;
    pic_url?: string;
    /** Fecha de corte de campaña (`YYYYMMDD`) — usada por Incentivos/Presupuesto en vez de la fecha real. */
    curr_fec?: string;
    /** Fechas de corte re-consultables, separadas por coma (`YYYYMMDD` cada una) — selector de fecha de Incentivos. */
    hab_fec?: string;
    /** Documento del usuario. Lo usa el host `cra-v6` del legado, que arma sus consultas con el propio usuario en vez de con la jerarquía. */
    num_doc?: string;
}

/** Un usuario alterno tal como lo devuelve el backend (`login_response.alternates`). */
export interface AlternateRaw {
    email_alt?: string;
    nombre_alt?: string;
    cargo_alt?: string;
}
