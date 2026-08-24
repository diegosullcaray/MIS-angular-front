import {
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  Input,
  inject,
  NgZone,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface MarcadorMapa {
  lat: number;
  lng: number;
  titulo?: string;
  subtitulo?: string;
}

/**
 * Componente de mapa interactivo basado en MapLibre GL.
 * Usa import dinámico (lazy) para no romper la compilación si el paquete no está instalado.
 * Estética Shadcn: popups redondeados, controles suaves, modo oscuro/claro automático.
 *
 * ⚠️  Requiere instalar maplibre-gl: `npm install maplibre-gl`
 */
@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-full h-full min-h-[400px] rounded-xl overflow-hidden border border-[var(--mis-border)]">
      <div #mapContainer class="w-full h-full absolute inset-0"></div>
      @if (!mapaCargado) {
        <div class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[var(--mis-surface-hover)]">
          <i class="pi pi-map text-5xl opacity-20 text-[var(--mis-text-secondary)]"></i>
          <span class="text-sm text-[var(--mis-text-tertiary)]">Cargando mapa...</span>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }

    :host ::ng-deep .maplibregl-popup-content {
      background: var(--mis-background) !important;
      color: var(--mis-text-primary) !important;
      border-radius: 0.75rem !important;
      border: 1px solid var(--mis-border) !important;
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.15) !important;
      padding: 12px 16px !important;
      font-family: inherit !important;
      min-width: 160px;
    }
    :host ::ng-deep .maplibregl-popup-close-button {
      color: var(--mis-text-secondary);
      right: 8px; top: 8px;
      border-radius: 4px;
      font-size: 18px;
      line-height: 1;
      padding: 2px 5px;
    }
    :host ::ng-deep .maplibregl-popup-close-button:hover { background: var(--mis-surface-hover); }
    :host ::ng-deep .maplibregl-ctrl-group {
      background: var(--mis-background) !important;
      border-radius: 0.5rem !important;
      border: 1px solid var(--mis-border) !important;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.08) !important;
      overflow: hidden;
    }
    :host ::ng-deep .maplibregl-ctrl-group button {
      width: 32px; height: 32px;
      border-bottom: 1px solid var(--mis-border) !important;
    }
    :host ::ng-deep .maplibregl-ctrl-group button:last-child { border-bottom: none !important; }
    :host ::ng-deep .maplibregl-ctrl-group button:hover { background: var(--mis-surface-hover) !important; }
  `],
})
export class MapaComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  @Input() marcadores: MarcadorMapa[] = [];
  @Input() oscuro = false;

  private zone = inject(NgZone);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private map: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private markersRef: any[] = [];

  protected mapaCargado = false;

  async ngOnInit(): Promise<void> {
    try {
      const maplibre = await import('maplibre-gl');

      // Inyectar CSS de MapLibre desde CDN si no está ya en el DOM
      if (!document.querySelector('link[data-maplibre-css]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css';
        link.setAttribute('data-maplibre-css', '1');
        document.head.appendChild(link);
      }

      this.zone.runOutsideAngular(() => {
        this.map = new maplibre.Map({
          container: this.mapContainer.nativeElement,
          style: this.getStyle(),
          center: [-75.015, -9.19],   // Perú
          zoom: 5,
          attributionControl: false,
        });

        this.map.addControl(new maplibre.NavigationControl({ showCompass: false }), 'bottom-right');

        this.map.on('load', () => {
          this.zone.run(() => { this.mapaCargado = true; });
          this.dibujarMarcadores(maplibre);
        });
      });
    } catch {
      console.warn('[app-mapa] maplibre-gl no está instalado todavía. Ejecuta: npm install maplibre-gl');
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map) return;

    if (changes['marcadores'] && this.mapaCargado) {
      import('maplibre-gl')
        .then((ml) => this.dibujarMarcadores(ml))
        .catch(() => {});
    }
    if (changes['oscuro']) {
      this.map.setStyle(this.getStyle());
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private dibujarMarcadores(maplibre: any): void {
    this.markersRef.forEach((m) => m.remove());
    this.markersRef = [];

    if (!this.marcadores?.length) return;

    const bounds = new maplibre.LngLatBounds();
    let hayValidos = false;

    for (const m of this.marcadores) {
      if (!m.lat || !m.lng) continue;

      const el = document.createElement('div');
      el.style.cssText = [
        'width:14px;height:14px;',
        'background:var(--mis-primary,#0191CE);',
        'border:2px solid var(--mis-background,#fff);',
        'border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.3);',
        'cursor:pointer;transition:transform .15s ease;',
      ].join('');
      el.addEventListener('mouseenter', () => (el.style.transform = 'scale(1.4)'));
      el.addEventListener('mouseleave', () => (el.style.transform = 'scale(1)'));

      const popup = new maplibre.Popup({ offset: 14, closeButton: true, maxWidth: '280px' })
        .setHTML(`
          <div style="display:flex;flex-direction:column;gap:3px;padding-right:10px">
            <strong style="font-size:13px;line-height:1.3">${m.titulo ?? 'Cliente'}</strong>
            ${m.subtitulo ? `<span style="font-size:12px;opacity:.65">${m.subtitulo}</span>` : ''}
          </div>
        `);

      const marker = new maplibre.Marker({ element: el })
        .setLngLat([m.lng, m.lat])
        .setPopup(popup)
        .addTo(this.map);

      this.markersRef.push(marker);
      bounds.extend([m.lng, m.lat]);
      hayValidos = true;
    }

    if (hayValidos) {
      this.map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 900 });
    }
  }

  private getStyle(): string {
    return this.oscuro
      ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
      : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }
}
