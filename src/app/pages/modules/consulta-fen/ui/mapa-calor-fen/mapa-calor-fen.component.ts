import { AfterViewInit, Component, DestroyRef, ElementRef, effect, inject, input, signal, viewChild } from '@angular/core';
import { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
import type { ExpressionSpecification } from 'maplibre-gl';
import type { PuntoCalorFen } from '../../models/consulta-fen.model';

const CENTRO_PERU: [number, number] = [-75.015152, -9.189967];
const FUENTE = 'riesgos-fen';

const ESTILO_OSM = {
  version: 8 as const,
  sources: {
    osm: {
      type: 'raster' as const,
      tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png', 'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap',
    },
  },
  layers: [{ id: 'osm', type: 'raster' as const, source: 'osm', paint: { 'raster-opacity': 0.48, 'raster-saturation': -0.65 } }],
};

/** Mapa de calor FEN: concentra los resultados por ubicación y pondera el riesgo predominante. */
@Component({
  selector: 'app-mapa-calor-fen',
  standalone: true,
  template: `
    <div class="relative h-full min-h-[350px] overflow-hidden rounded-xl border border-[var(--mis-border)] bg-[var(--mis-panel-bg)]">
      <div #mapaEl class="h-full w-full"></div>
      <div class="pointer-events-none absolute left-3 top-3 rounded-lg border border-[var(--mis-border)] bg-[var(--mis-surface)]/95 px-3 py-2 shadow-[var(--mis-shadow-sm)]">
        <p class="m-0 text-xs font-semibold text-[var(--mis-text-primary)]">Mapa de calor FEN</p>
        <p class="m-0 text-[10px] text-[var(--mis-text-tertiary)]">Mayor intensidad = mayor exposición predominante</p>
      </div>
      <div class="pointer-events-none absolute bottom-7 right-3 flex items-center gap-2 rounded-full border border-[var(--mis-border)] bg-[var(--mis-surface)]/95 px-2 py-1 text-[10px] text-[var(--mis-text-secondary)]">
        <span>Bajo</span><span class="h-2 w-20 rounded-full bg-gradient-to-r from-[var(--mis-success)] via-[var(--mis-warning)] to-[var(--mis-danger)]"></span><span>Alto</span>
      </div>
      <div class="pointer-events-none absolute right-3 top-3 grid h-14 w-14 place-items-center rounded-full border border-[var(--mis-border)] bg-[var(--mis-surface)]/95 text-[9px] font-bold text-[var(--mis-text-secondary)] shadow-[var(--mis-shadow-sm)]" aria-hidden="true">
        <span class="absolute top-0.5">N</span><span class="absolute right-1">E</span><span class="absolute bottom-0.5">S</span><span class="absolute left-1">O</span>
        <i class="pi pi-compass text-lg text-[var(--mis-primary)]"></i>
      </div>
      @if (fallo()) {
        <p class="absolute inset-x-3 bottom-3 m-0 rounded-lg bg-[var(--mis-warning-light)] p-2 text-xs text-[var(--mis-warning)]">No se pudieron cargar los mosaicos base; la capa de calor sigue disponible.</p>
      }
    </div>
  `,
  styles: [`:host { display: block; height: 100%; }`],
})
export class MapaCalorFenComponent implements AfterViewInit {
  readonly puntos = input.required<readonly PuntoCalorFen[]>();
  readonly seleccionado = input<string | null>(null);

  private readonly contenedor = viewChild.required<ElementRef<HTMLDivElement>>('mapaEl');
  protected readonly fallo = signal(false);
  private mapa: MapLibreMap | null = null;
  private observador: ResizeObserver | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.observador?.disconnect();
      this.mapa?.remove();
    });
    effect(() => {
      const datos = this.geoJson(this.puntos());
      (this.mapa?.getSource(FUENTE) as GeoJSONSource | undefined)?.setData(datos);
      this.mapa?.setFilter('seleccion-fen', ['==', ['get', 'ubigeo'], this.seleccionado() ?? '']);
    });
  }

  ngAfterViewInit(): void {
    const mapa = new MapLibreMap({ container: this.contenedor().nativeElement, style: ESTILO_OSM, center: CENTRO_PERU, zoom: 4.7, attributionControl: { compact: true } });
    mapa.on('error', () => this.fallo.set(true));
    mapa.on('load', () => {
      mapa.addSource(FUENTE, { type: 'geojson', data: this.geoJson(this.puntos()) });
      mapa.addLayer({ id: 'calor-fen', type: 'heatmap', source: FUENTE, paint: {
        'heatmap-weight': ['get', 'intensidad'],
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 4, 1.2, 9, 2.4],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 4, 24, 9, 52],
        'heatmap-opacity': 0.82,
        'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(34,197,94,0)', 0.25, 'rgb(34,197,94)', 0.55, 'rgb(234,179,8)', 0.8, 'rgb(249,115,22)', 1, 'rgb(220,38,38)'],
      } });
      const colorNivel: ExpressionSpecification = ['match', ['get', 'nivel'], 'Muy Alto', 'rgb(220,38,38)', 'Alto', 'rgb(249,115,22)', 'Medio', 'rgb(234,179,8)', 'Bajo', 'rgb(34,197,94)', 'rgb(13,158,110)'];
      mapa.addLayer({ id: 'puntos-fen', type: 'circle', source: FUENTE, paint: { 'circle-radius': 5, 'circle-color': colorNivel, 'circle-stroke-color': 'white', 'circle-stroke-width': 1.5 } });
      mapa.addLayer({ id: 'seleccion-fen', type: 'circle', source: FUENTE, filter: ['==', ['get', 'ubigeo'], this.seleccionado() ?? ''], paint: { 'circle-radius': 24, 'circle-color': colorNivel, 'circle-opacity': 0.24, 'circle-stroke-color': colorNivel, 'circle-stroke-width': 3 } });
    });
    this.mapa = mapa;
    this.observador = new ResizeObserver(() => mapa.resize());
    this.observador.observe(this.contenedor().nativeElement);
  }

  private geoJson(puntos: readonly PuntoCalorFen[]) {
    return { type: 'FeatureCollection' as const, features: puntos.map((punto) => ({ type: 'Feature' as const, properties: { intensidad: punto.intensidad, ubigeo: punto.ubigeo, nivel: punto.nivel }, geometry: { type: 'Point' as const, coordinates: [punto.lng, punto.lat] } })) };
  }
}
