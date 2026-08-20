import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModSeccionesService } from '../../../../core/winder/instances/mod-secciones.service';
import { ModSysAdminService } from '../../../../core/winder/instances/mod-sys-admin.service';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import type { ComisionTarjeta, DetalleCategorizacion, RequisitoTarjeta } from '../models/dashboard.model';
import type { NodoJerarquiaAncla, SectoristaItem } from '../models/colaborador.model';
import type {
  BaseHierResponseBody,
  DetalleCategorizacionRaw,
  DetalleResponseBody,
  ListPickResponseBody,
  PeriodoComisionRaw,
} from '../models/categorizacion-api.model';

/** Etiquetas fijas de las 4 tarjetas de "Estado Requisitos" (legado, sin traer nombre del backend). */
const ETIQUETAS_REQUISITOS = ['Disciplina', 'Calificación', 'Permanencia', 'Formación'] as const;

/** `cod_jer` de la jerarquía usada para ubicar el nodo ancla del admin — mismo código (9, "Admin. */
const COD_JERARQUIA_ANCLA = 9;

/** Fachada del módulo `categorizacion` — migrado de `CategorizacionComponent` + `AnalistaService` (legado STG, `docs/07-modulos/analista/categorizacion`). */
@Injectable({ providedIn: 'root' })
export class CategorizacionService {
  private readonly ant = inject(ModSeccionesService);
  private readonly antAdmin = inject(ModSysAdminService);
  private readonly shell = inject(ShellStateService);

  private get email(): string {
    return this.shell.usuarioActivo()?.email ?? '';
  }

  esAdmin(): boolean {
    return this.shell.esAdmin();
  }

  obtenerDetalle(codBt: string): Observable<DetalleCategorizacion | null> {
    return this.ant.getDetalleCategorizacion(codBt).pipe(
      map((response) => {
        const body = response.body as DetalleResponseBody | null;
        const data = body?.resultado?.data;
        if (!data) return null;

        const periodos = body?.resultado?.per ?? [];
        return {
          perfil: {
            nombre: data.nom,
            cargo: data.car,
            genero: data.gen,
            categoria: data.cat,
            unidad: data.uni,
            corredor: data.corr,
            territorio: data.terr,
          },
          requisitos: this.aRequisitos(data),
          comisiones: this.aComisiones(data, periodos),
        };
      })
    );
  }

  /** Nodo ancla del admin en la jerarquía (`base_hier`, `cod_jer=9`) — primer nodo con `flag_1` en `{0,1,2}`, tal cual el filtro del legado (`CategorizacionComponent.ngOnInit`), sin poder confirmar contra el backend real qué representa cada valor de `flag_1`. */
  obtenerAnclaAdmin(): Observable<NodoJerarquiaAncla | null> {
    return this.antAdmin.getBaseHierarchy(this.email, COD_JERARQUIA_ANCLA).pipe(
      map((response) => {
        const nodos = (response.body as BaseHierResponseBody | null)?.base_hierarchy ?? [];
        return nodos.find((n) => n.flag_1 === 0 || n.flag_1 === 1 || n.flag_1 === 2) ?? null;
      })
    );
  }

  /** Lista de sectoristas bajo el nodo ancla, para el selector de colaborador. */
  obtenerSectoristas(tipCod: number, codRel: string): Observable<SectoristaItem[]> {
    return this.antAdmin.getListPick01(tipCod, codRel).pipe(
      map((response) => (response.body as ListPickResponseBody | null)?.list_res ?? [])
    );
  }

  private aRequisitos(data: DetalleCategorizacionRaw): RequisitoTarjeta[] {
    const valores: Array<[string, number]> = [
      [data.r1, data.ri1],
      [data.r2, data.ri2],
      [data.r3, data.ri3],
      [data.r4, data.ri4],
    ];
    return valores.map(([valor, situacion], i) => ({
      etiqueta: ETIQUETAS_REQUISITOS[i],
      valor,
      cumplido: situacion === 1,
    }));
  }

  private aComisiones(data: DetalleCategorizacionRaw, periodos: PeriodoComisionRaw[]): ComisionTarjeta[] {
    const valores: Array<[string, number]> = [
      [data.c1, data.ci1],
      [data.c2, data.ci2],
      [data.c3, data.ci3],
      [data.c4, data.ci4],
      [data.c5, data.ci5],
      [data.c6, data.ci6],
    ];
    return valores.map(([valor, situacion], i) => ({
      periodo: periodos[i]?.nom ?? '',
      valor,
      cumplido: situacion === 1,
    }));
  }
}
