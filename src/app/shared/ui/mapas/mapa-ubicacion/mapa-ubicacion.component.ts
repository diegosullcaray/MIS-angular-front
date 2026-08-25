import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { MapLibreMap, Marker } from 'maplibre-gl';
import { ThemeService } from '../../../services/theme.service';

/** Centro del Perú — encuadre inicial del legado (`L.latLng(-9.189967, -75.015152)`). */
const CENTRO_PERU: [number, number] = [-75.015152, -9.189967];
/** Mismo acercamiento que usaba el legado al enfocar un cliente. */
const ZOOM_CLIENTE = 14;

/** Mosaicos de OpenStreetMap, los mismos del legado — no requieren API key. */
const ESTILO_OSM = {
  version: 8 as const,
  sources: {
    osm: {
      type: 'raster' as const,
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap',
    },
  },
  layers: [{ id: 'osm', type: 'raster' as const, source: 'osm' }],
};

/**
 * Mapa de la ubicación de un cliente — reemplaza el Leaflet del legado
 * (`detalle-dialog.component.ts`) por MapLibre GL JS.
 *
 * El modo oscuro se resuelve con un filtro CSS sobre el canvas: los mosaicos de
 * OSM solo existen en claro, y filtrar solo el canvas deja el pin y los
 * controles con sus colores reales (viven en capas DOM aparte).
 */
@Component({
  selector: 'app-mapa-ubicacion',
  standalone: true,
  imports: [],
  template: `
    <div
      class="group relative h-full w-full min-h-[360px] overflow-hidden rounded-xl border border-[var(--mis-border)] bg-[var(--mis-surface)] shadow-[var(--mis-shadow-sm)]"
    >
      <!--
        h-full w-full y no absolute inset-0: MapLibre le pone su clase
        .maplibregl-map (position: relative), que se carga después de Tailwind
        y gana a absolute; ya relativo, el inset-0 deja de dimensionar y el
        contenedor colapsa a 0 de alto, ocultando por su overflow:hidden el
        mapa entero.
      -->
      <div #mapaEl class="h-full w-full" [class.mapa-oscuro]="oscuro()"></div>

      <!-- Ficha del cliente. -->
      <div class="pointer-events-none absolute left-3 top-3 z-10 max-w-[75%]">
        <div
          class="rounded-lg border border-[var(--mis-border)] bg-[var(--mis-surface)]/95 px-3 py-2 shadow-[var(--mis-shadow-md)] backdrop-blur-sm"
        >
          <p class="m-0 truncate text-[13px] font-semibold leading-tight text-[var(--mis-text-primary)]">
            {{ etiqueta() || 'Ubicación' }}
          </p>
          <span
            class="mt-1.5 inline-flex items-center gap-1 rounded-md border border-[var(--mis-border)] bg-[var(--mis-hover-bg)] px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-[var(--mis-text-tertiary)]"
          >
            <i class="pi pi-map-marker text-[9px]"></i>{{ coordenadas() }}
          </span>
        </div>
      </div>

      <!-- Controles propios: los de MapLibre no siguen el tema del sistema. -->
      <div
        class="absolute right-3 top-3 z-10 flex flex-col divide-y divide-[var(--mis-border)] overflow-hidden rounded-lg border border-[var(--mis-border)] bg-[var(--mis-surface)]/90 shadow-[var(--mis-shadow-md)] backdrop-blur-sm"
      >
        <button type="button" [class]="claseControl" (click)="acercar()" aria-label="Acercar" title="Acercar">
          <i class="pi pi-plus text-[11px]"></i>
        </button>
        <button type="button" [class]="claseControl" (click)="alejar()" aria-label="Alejar" title="Alejar">
          <i class="pi pi-minus text-[11px]"></i>
        </button>
        <button type="button" [class]="claseControl" (click)="recentrar()" aria-label="Centrar en el cliente" title="Centrar en el cliente">
          <i class="pi pi-compass text-[12px]"></i>
        </button>
      </div>

      @if (fallo()) {
        <div
          class="absolute inset-x-3 bottom-8 z-10 flex items-start gap-2 rounded-lg border border-[var(--mis-warning)] bg-[var(--mis-warning-light)] px-3 py-2 text-[11px] leading-snug text-[var(--mis-warning)] shadow-[var(--mis-shadow-md)]"
        >
          <i class="pi pi-exclamation-triangle mt-px text-[11px]"></i>
          <span>No se pudieron cargar los mosaicos del mapa (¿sin salida a internet?). Las coordenadas del cliente sí son válidas.</span>
        </div>
      }

      <!-- Pin: lo dibuja Angular y MapLibre solo lo posiciona. -->
      <div #pinEl class="relative flex h-6 w-6 cursor-default items-center justify-center">
        <span class="absolute inline-flex h-6 w-6 animate-ping rounded-full bg-[var(--mis-danger)] opacity-30"></span>
        <span class="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-[var(--mis-danger)] shadow-md"></span>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    /* Solo el canvas: así el pin y los controles no se invierten.
       Va con ::ng-deep porque el canvas lo crea MapLibre y no lleva el
       atributo de encapsulación del componente. */
    .mapa-oscuro ::ng-deep .maplibregl-canvas {
      filter: invert(1) hue-rotate(180deg) brightness(0.92) contrast(0.9);
    }
    /* La atribución de OSM es obligatoria: se mantiene, solo se atenúa. */
    :host ::ng-deep .maplibregl-ctrl-attrib {
      background: color-mix(in srgb, var(--mis-surface) 85%, transparent) !important;
      border-radius: var(--mis-radius-sm) 0 0 0;
    }
    :host ::ng-deep .maplibregl-ctrl-attrib,
    :host ::ng-deep .maplibregl-ctrl-attrib a {
      font-size: 10px;
      color: var(--mis-text-tertiary);
    }
    :host ::ng-deep .maplibregl-ctrl-attrib-button { filter: invert(0.5); }
  `],
})
export class MapaUbicacionComponent implements AfterViewInit {
  private readonly tema = inject(ThemeService);
  private readonly contenedor = viewChild.required<ElementRef<HTMLDivElement>>('mapaEl');
  private readonly pin = viewChild.required<ElementRef<HTMLDivElement>>('pinEl');

  readonly lat = input.required<number>();
  readonly lng = input.required<number>();
  readonly etiqueta = input<string>('');

  protected readonly oscuro = this.tema.oscuro;
  protected readonly fallo = signal(false);
  protected readonly coordenadas = computed(() => `${this.lat().toFixed(5)}, ${this.lng().toFixed(5)}`);

  /** Botón de control: mismo tratamiento para los tres (tamaño, hover y foco del sistema). */
  protected readonly claseControl =
    'flex h-8 w-8 items-center justify-center text-[var(--mis-text-secondary)] transition-colors ' +
    'hover:bg-[var(--mis-hover-bg)] hover:text-[var(--mis-text-primary)] ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--mis-accent)]';

  private mapa: MapLibreMap | null = null;
  private marcador: Marker | null = null;
  private observador: ResizeObserver | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.observador?.disconnect();
      this.marcador?.remove();
      this.mapa?.remove();
    });

    // Reencuadra cuando cambia el cliente elegido, sin recrear el mapa.
    effect(() => {
      const centro: [number, number] = [this.lng(), this.lat()];
      if (!this.mapa) return;
      this.marcador?.setLngLat(centro);
      this.mapa.easeTo({ center: centro, zoom: ZOOM_CLIENTE, duration: 600 });
    });
  }

  protected acercar(): void {
    this.mapa?.zoomIn();
  }

  protected alejar(): void {
    this.mapa?.zoomOut();
  }

  /** Vuelve al cliente tras haber navegado por el mapa. */
  protected recentrar(): void {
    this.mapa?.easeTo({ center: [this.lng(), this.lat()], zoom: ZOOM_CLIENTE, duration: 500 });
  }

  ngAfterViewInit(): void {
    const centro: [number, number] = [this.lng(), this.lat()];
    const mapa = new MapLibreMap({
      container: this.contenedor().nativeElement,
      style: ESTILO_OSM,
      center: Number.isFinite(centro[0]) && Number.isFinite(centro[1]) ? centro : CENTRO_PERU,
      zoom: ZOOM_CLIENTE,
      attributionControl: { compact: true },
    });

    // Sin `NavigationControl`: los botones propios de arriba ya cubren zoom y
    // centrado, y siguen los tokens del tema en vez del cromado de MapLibre.
    // Un fallo de mosaicos no debe romper la vista: se avisa y se deja el pin.
    mapa.on('error', () => this.fallo.set(true));

    // `center` y no `bottom`: el pin es un punto sobre la coordenada, no una chincheta.
    this.marcador = new Marker({ element: this.pin().nativeElement, anchor: 'center' }).setLngLat(centro).addTo(mapa);
    this.mapa = mapa;

    // Dentro del diálogo el contenedor todavía mide 0 mientras la animación de
    // apertura corre, y MapLibre se queda con ese tamaño: hay que remedirlo
    // cuando crece (equivale al `invalidateSize()` del Leaflet del legado).
    this.observador = new ResizeObserver(() => mapa.resize());
    this.observador.observe(this.contenedor().nativeElement);
  }
}
