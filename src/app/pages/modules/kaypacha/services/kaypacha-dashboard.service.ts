import { Injectable, inject, signal } from '@angular/core';
import { ModKaypachaService } from '../../../../core/winder/instances/mod-kaypacha.service';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import type {
  TableHeaderDef,
  KaypachaColaboradorItem,
  KaypachaResultadoRaw,
  KaypachaResponseBody,
} from '../models';

@Injectable({ providedIn: 'root' })
export class KaypachaDashboardService {
  private readonly ant = inject(ModKaypachaService);
  private readonly shell = inject(ShellStateService);

  readonly ruta = '/app/Kaypacha__';

  // Estado reactivo principal
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly nombreUsuario = signal<string>('');
  readonly cargo = signal<string>('');
  readonly posicion = signal<string | number>('-');
  readonly puntajeFinal = signal<string | number>('0');
  readonly permitirBusqueda = signal<boolean>(true);

  // Tablas
  readonly headers1 = signal<TableHeaderDef[]>([]);
  readonly headers1_1 = signal<TableHeaderDef[]>([]);
  readonly dataSources1 = signal<any[]>([]);

  readonly headers2 = signal<TableHeaderDef[]>([]);
  readonly headers2_2 = signal<TableHeaderDef[]>([]);
  readonly dataSources2 = signal<any[]>([]);

  // Buscador de colaboradores
  readonly colaboradores = signal<KaypachaColaboradorItem[]>([]);
  readonly cargandoColaboradores = signal(false);
  readonly errorColaboradores = signal<string | null>(null);

  private parseJsonHeader(cab: any[] | undefined): TableHeaderDef[] {
    if (!cab || !cab.length || !cab[0]?.JSONNHEAD1) return [];
    try {
      return JSON.parse(cab[0].JSONNHEAD1) as TableHeaderDef[];
    } catch {
      return [];
    }
  }

  /**
   * Limpia todo el estado de datos en memoria para evitar mostrar información de otro sistema o sesión.
   */
  limpiar(): void {
    this.loading.set(true);
    this.error.set(null);

    this.nombreUsuario.set('');
    this.cargo.set('');
    this.posicion.set('-');
    this.puntajeFinal.set('0');

    this.headers1.set([]);
    this.headers1_1.set([]);
    this.dataSources1.set([]);

    this.headers2.set([]);
    this.headers2_2.set([]);
    this.dataSources2.set([]);

    this.colaboradores.set([]);
    this.cargandoColaboradores.set(false);
    this.errorColaboradores.set(null);
  }

  /**
   * Carga los datos del tablero para el colaborador indicado (o el usuario activo si no se pasa codBT).
   */
  cargarDatos(codBT?: string): void {
    this.loading.set(true);
    this.error.set(null);

    // Limpia datos previos antes de pedir la nueva información
    this.headers1.set([]);
    this.headers1_1.set([]);
    this.dataSources1.set([]);
    this.headers2.set([]);
    this.headers2_2.set([]);
    this.dataSources2.set([]);
    this.nombreUsuario.set('');
    this.cargo.set('');
    this.posicion.set('-');
    this.puntajeFinal.set('0');

    const targetCodBt = codBT || this.shell.usuarioActivo()?.codBt;

    this.ant.getColaboradoresData(targetCodBt).subscribe({
      next: (response) => {
        const body = response.body as KaypachaResponseBody | null;
        const res = body?.resultado as KaypachaResultadoRaw | undefined;

        if (!res) {
          this.error.set('No se encontraron resultados para este usuario.');
          this.loading.set(false);
          return;
        }

        // Tablas y cabeceras
        this.headers1.set(this.parseJsonHeader(res.cab1));
        this.headers1_1.set(this.parseJsonHeader(res.cab1_1));
        this.dataSources1.set(res.res1 || []);

        this.headers2.set(this.parseJsonHeader(res.cab2));
        this.headers2_2.set(this.parseJsonHeader(res.cab2_2));
        this.dataSources2.set(res.res2 || []);

        // Datos del usuario y puntajes: solo mostrar nombre/cargo si se seleccionó explícitamente un colaborador
        this.puntajeFinal.set(res.puntos?.HPUNTAFINAL ?? '0');
        this.posicion.set(res.puntos?.HDESPOS ?? '-');

        if (codBT) {
          this.nombreUsuario.set(res.datosUsurio?.HDESPER ?? '');
          this.cargo.set(res.datosUsurio?.HDESCAR ?? '');
        } else {
          this.nombreUsuario.set('');
          this.cargo.set('');
        }

        // Botón de búsqueda habilitado por defecto o según perfil
        this.permitirBusqueda.set(res.puntos?.HACTBOTON === '1' || true);

        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar datos del tablero Kaypacha:', err);
        this.error.set('No se pudo cargar la información del tablero Kaypacha.');
        this.loading.set(false);
      },
    });
  }

  /**
   * Carga la lista de colaboradores para el modal de búsqueda.
   */
  cargarListaColaboradores(): void {
    if (this.colaboradores().length > 0 && !this.errorColaboradores()) {
      return; // Ya cargados
    }

    this.cargandoColaboradores.set(true);
    this.errorColaboradores.set(null);

    this.ant.getUserLists().subscribe({
      next: (response) => {
        const body = response.body as KaypachaResponseBody | null;
        const list = (body?.resultado as KaypachaColaboradorItem[]) || [];
        this.colaboradores.set(list);
        this.cargandoColaboradores.set(false);
      },
      error: (err) => {
        console.error('Error al cargar la lista de colaboradores:', err);
        this.errorColaboradores.set('No se pudo cargar la lista de colaboradores.');
        this.cargandoColaboradores.set(false);
      },
    });
  }
}
