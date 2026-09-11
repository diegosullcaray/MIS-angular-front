import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { ThemeService } from '../../../../shared/services/theme.service';
import { AparienciaDomAdaptador } from './apariencia-dom.service';
import { REPOSITORIO_PREFERENCIAS } from '../interfaces/preferencias-almacen.model';
import { MAX_RECIENTES, PREFERENCIAS_POR_DEFECTO } from '../interfaces/preferencias.model';
import type {
  ModoSidebar,
  ModoTema,
  Preferencias,
  PreferenciasApariencia,
  PreferenciasEstructura,
  ReporteReciente,
  VistaExplorador,
} from '../interfaces/preferencias.model';

/** Caso de uso de las preferencias del Host. */
@Injectable({ providedIn: 'root' })
export class PreferenciasService {
  private readonly repositorio = inject(REPOSITORIO_PREFERENCIAS);
  private readonly aparienciaDom = inject(AparienciaDomAdaptador);
  private readonly theme = inject(ThemeService);

  private readonly _preferencias = signal<Preferencias>(this.repositorio.leer() ?? PREFERENCIAS_POR_DEFECTO);

  readonly preferencias = this._preferencias.asReadonly();
  readonly apariencia = computed(() => this._preferencias().apariencia);
  readonly estructura = computed(() => this._preferencias().estructura);
  readonly anuncios = computed(() => this._preferencias().anuncios);
  readonly bienvenida = computed(() => this._preferencias().bienvenida);
  readonly recientes = computed(() => this._preferencias().recientes);

  /** `true` cuando el usuario no cambió nada: habilita el botón de restablecer. */
  readonly esPorDefecto = computed(
    () => JSON.stringify(this._preferencias()) === JSON.stringify(PREFERENCIAS_POR_DEFECTO),
  );

  constructor() {
    // El tema se aplica antes que nada: el adaptador de apariencia necesita
    // saber si el resultado es claro u oscuro para derivar los tonos del acento.
    effect(() => this.theme.setModo(this.apariencia().tema));

    effect(() => this.aparienciaDom.aplicar(this.apariencia(), this.theme.oscuro()));
    effect(() => this.aparienciaDom.aplicarEstructura(this.estructura()));
  }

  // ─── Apariencia ───────────────────────────────────────────────────────────

  setTema(tema: ModoTema): void {
    this.parchearApariencia({ tema });
  }

  /** Alterna claro ↔ oscuro tomando como partida el tema que se ve. */
  alternarTema(): void {
    this.setTema(this.theme.oscuro() ? 'claro' : 'oscuro');
  }

  setFondo(fondo: string): void {
    this.parchearApariencia({ fondo });
  }

  /** Elegir un color a mano implica quedarse en el fondo personalizado. */
  setColorFondo(colorFondo: string): void {
    this.parchearApariencia({ colorFondo });
  }

  setAcento(acento: string): void {
    this.parchearApariencia({ acento });
  }

  // ─── Estructura ───────────────────────────────────────────────────────────

  setModoSidebar(modoSidebar: ModoSidebar): void {
    this.parchearEstructura({ modoSidebar });
  }

  setEtiquetasSidebar(etiquetasSidebar: boolean): void {
    this.parchearEstructura({ etiquetasSidebar });
  }

  setVistaExplorador(vistaExplorador: VistaExplorador): void {
    this.parchearEstructura({ vistaExplorador });
  }

  // ─── Anuncios ─────────────────────────────────────────────────────────────

  /** Marca anuncios como vistos: es lo que impide que vuelvan a aparecer. */
  marcarAnunciosVistos(ids: readonly string[]): void {
    if (ids.length === 0) return;

    const vistos = new Set([...this._preferencias().anuncios.vistos, ...ids]);
    this.actualizar((p) => ({ ...p, anuncios: { ...p.anuncios, vistos: [...vistos] } }));
  }

  setSilenciarAnuncios(silenciar: boolean): void {
    this.actualizar((p) => ({ ...p, anuncios: { ...p.anuncios, silenciar } }));
  }

  /** Vuelve a habilitar los anuncios ya cerrados — la contraparte de "no mostrar más". */
  reiniciarAnuncios(): void {
    this.actualizar((p) => ({ ...p, anuncios: { vistos: [], silenciar: false } }));
  }

  // ─── Bienvenida ───────────────────────────────────────────────────────────

  /** Da por vista la bienvenida de Pachi: no vuelve a abrirse sola. */
  marcarBienvenidaVista(): void {
    if (this._preferencias().bienvenida.vista) return;
    this.actualizar((p) => ({ ...p, bienvenida: { vista: true } }));
  }

  // ─── Reportes recientes ───────────────────────────────────────────────────

  /**
   * Deja el reporte al frente del historial de accesos rápidos del Home.
   *
   * Si ya estaba, no se duplica: se quita de donde estuviera y vuelve arriba
   * con la fecha nueva, que es lo que hace que la lista sea "los últimos" y no
   * "los primeros".
   */
  registrarReporteReciente(ruta: string, titulo: string, categoria?: string): void {
    if (!ruta || !titulo) return;

    const entrada: ReporteReciente = {
      ruta,
      titulo,
      fechaVisita: Date.now(),
      ...(categoria ? { categoria } : {}),
    };

    this.actualizar((p) => ({
      ...p,
      recientes: [entrada, ...p.recientes.filter((r) => r.ruta !== ruta)].slice(0, MAX_RECIENTES),
    }));
  }

  /** Vacía el historial sin tocar el resto de las preferencias. */
  limpiarRecientes(): void {
    this.actualizar((p) => ({ ...p, recientes: [] }));
  }

  // ─── Ciclo de vida ────────────────────────────────────────────────────────

  /** Devuelve todo a los valores de fábrica y borra lo guardado. */
  restablecer(): void {
    this._preferencias.set(PREFERENCIAS_POR_DEFECTO);
    this.repositorio.limpiar();
  }

  /** Restablece preferencias sin guardar (para cierre de sesión). */
  olvidar(): void {
    this._preferencias.set(PREFERENCIAS_POR_DEFECTO);
  }

  private parchearApariencia(cambio: Partial<PreferenciasApariencia>): void {
    this.actualizar((p) => ({ ...p, apariencia: { ...p.apariencia, ...cambio } }));
  }

  private parchearEstructura(cambio: Partial<PreferenciasEstructura>): void {
    this.actualizar((p) => ({ ...p, estructura: { ...p.estructura, ...cambio } }));
  }

  private actualizar(cambio: (actual: Preferencias) => Preferencias): void {
    const siguiente = cambio(this._preferencias());
    this._preferencias.set(siguiente);
    this.repositorio.guardar(siguiente);
  }
}
