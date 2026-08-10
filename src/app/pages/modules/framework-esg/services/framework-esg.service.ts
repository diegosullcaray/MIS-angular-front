import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModFrameworkEsgService } from '../../../../core/winder/instances/mod-framework-esg.service';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import type {
  EsgActualizarMetricaPayload,
  EsgConfiguracionModulo,
  EsgMetricaFila,
  EsgResumenCategoria,
  EsgResumenPortadaFila,
  EsgUsuariosPorMetrica,
} from '../models';

/** Forma cruda de `esg.cfg_mod` (`resultado`) — cada bloque trae su valor de negocio serializado en `cfg` (JSON string). */
interface ConfiguracionModuloBody {
  resultado?: {
    sit?: { cfg?: string };
    attr?: { cfg?: string };
    cats?: { cfg?: string };
    mod_admin?: { cfg?: string };
    can_edit?: { cfg?: string };
  };
}

/** Forma cruda de `esg.res_por` (`resultado`) — arreglo directo, sin envoltura `JSONLIST`. */
interface ResumenPortadaBody {
  resultado?: EsgResumenPortadaFila[];
}

/** Forma cruda de `esg.res_cat` (`resultado`) — columnas históricas dinámicas + filas. */
interface ResumenCategoriaBody {
  resultado?: {
    cab?: { cols?: string };
    res?: EsgMetricaFila[];
  };
}

/** Forma cruda de `esg.get_users` (`resultado`) — `row.use_lis` es una lista de `cod_bt` separada por coma, ausente si no hay usuarios. */
interface UsuariosMetricaBody {
  resultado?: {
    code?: string;
    row?: { use_lis?: string };
  };
}

/** Parsea un bloque `{ cfg: '<json>' }` de `esg.cfg_mod`, devolviendo `fallback` si falta o el JSON es inválido. */
function parseCfg<T>(bloque: { cfg?: string } | undefined, fallback: T): T {
  if (!bloque?.cfg) return fallback;
  try {
    return JSON.parse(bloque.cfg) as T;
  } catch {
    return fallback;
  }
}

/**
 * Fachada del módulo `framework-esg` (Cuadro de Mando ESG, `/app/esg`) —
 * traduce las respuestas crudas del backend Ant (`ModFrameworkEsgService`,
 * puerto 6302) a los modelos tipados que consumen las pantallas.
 *
 * Migrado de `FrameworkEsgService`/`ModFrameworkEsgService` (legado STG,
 * `pages/modules/framework-esg/compartido/servicios`). El legado guardaba
 * `selectedRow`/`histEditKeys`/`editMode` como estado mutable compartido en
 * este mismo servicio; en esta migración esos datos son responsabilidad de
 * `PrincipalComponent` (dueño de la pantalla) y viajan como `@Input()` hacia
 * los diálogos de Editar/Usuarios — más cerca de cómo ya lo hacen
 * `CarteraCreditosComponent`/`BuscadorColaboradorDialogComponent`.
 */
@Injectable({ providedIn: 'root' })
export class FrameworkEsgService {
  private readonly ant = inject(ModFrameworkEsgService);
  private readonly shell = inject(ShellStateService);

  private get codBt(): string | undefined {
    return this.shell.usuarioActivo()?.codBt;
  }

  /** Admin del Host (`ShellStateService.esAdmin()`) O admin propio del módulo (`mod_admin.cfg`) — igual que `profile.tip_use==0 || r.mod_admin.cfg` del legado. */
  esAdmin(configuracion: EsgConfiguracionModulo | null): boolean {
    return this.shell.esAdmin() || (configuracion?.moduloAdmin ?? false);
  }

  cargarConfiguracion(): Observable<EsgConfiguracionModulo> {
    return this.ant.getConfiguracionMod(this.codBt).pipe(
      map((r) => {
        const resultado = (r.body as ConfiguracionModuloBody | null)?.resultado;
        return {
          situaciones: parseCfg(resultado?.sit, []),
          atributos: parseCfg(resultado?.attr, []),
          categorias: parseCfg(resultado?.cats, []),
          moduloAdmin: parseCfg(resultado?.mod_admin, false),
          puedeEditar: parseCfg(resultado?.can_edit, false),
        };
      })
    );
  }

  cargarResumenPortada(): Observable<EsgResumenPortadaFila[]> {
    return this.ant.getResumenPor().pipe(map((r) => (r.body as ResumenPortadaBody | null)?.resultado ?? []));
  }

  cargarResumenCategoria(codCat: number, esAdmin: boolean): Observable<EsgResumenCategoria> {
    return this.ant.getResumenCat(codCat, this.codBt, esAdmin ? 1 : 0).pipe(
      map((r) => {
        const resultado = (r.body as ResumenCategoriaBody | null)?.resultado;
        const cols = resultado?.cab?.cols;
        return {
          columnasHistoricas: cols ? cols.split(',') : [],
          filas: resultado?.res ?? [],
        };
      })
    );
  }

  actualizarMetrica(codMet: number, payload: EsgActualizarMetricaPayload): Observable<boolean> {
    return this.ant
      .postActualizaMet(this.codBt, codMet, payload)
      .pipe(map((r) => (r as { body?: { result?: { code?: number } } } | null)?.body?.result?.code === 200));
  }

  obtenerUsuariosMetrica(codMet: string): Observable<string[]> {
    return this.ant.getMetUsers(codMet).pipe(
      map((r) => {
        const resultado = (r.body as UsuariosMetricaBody | null)?.resultado;
        const lista = resultado?.code !== 'void' ? resultado?.row?.use_lis : undefined;
        return lista ? lista.split(',') : [];
      })
    );
  }

  guardarUsuariosPorMetrica(cambios: EsgUsuariosPorMetrica[]): Observable<unknown> {
    return this.ant.postMetUsers(cambios);
  }
}
