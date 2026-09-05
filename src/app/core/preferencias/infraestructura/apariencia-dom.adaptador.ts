import { Injectable } from '@angular/core';
import { aclarar, hexARgba, mezclar, oscurecer, textoSobre } from '../dominio/color.util';
import { fondoEfectivo } from '../dominio/preferencias.model';
import type { PreferenciasApariencia, PreferenciasEstructura } from '../dominio/preferencias.model';

/** Adaptador de apariencia: convierte preferencias en variables CSS. */
@Injectable({ providedIn: 'root' })
export class AparienciaDomAdaptador {
  private get raiz(): HTMLElement {
    return document.documentElement;
  }

  /** Aplica fondo y acento. `oscuro` es el tema ya resuelto (`sistema` incluido). */
  aplicar(apariencia: PreferenciasApariencia, oscuro: boolean): void {
    this.aplicarFondo(apariencia, oscuro);
    this.aplicarAcento(apariencia.acento, oscuro);
  }

  /** Publica el modo del menú como atributo de `<html>`. */
  aplicarEstructura(estructura: PreferenciasEstructura): void {
    this.raiz.dataset['menu'] = estructura.modoSidebar;
    // El modo delgado es "solo íconos" por definición: ahí la preferencia de
    // etiquetas no se consulta, se fuerza.
    const conEtiquetas = estructura.modoSidebar !== 'delgado' && estructura.etiquetasSidebar;
    this.raiz.dataset['menuEtiquetas'] = conEtiquetas ? 'si' : 'no';

    // Sin etiquetas el rail no necesita los 64px; el ancho es un token, así que
    // el resto del shell se acomoda solo.
    if (conEtiquetas) this.quitar('--mis-sidebar-col1-w');
    else this.poner('--mis-sidebar-col1-w', '52px');
  }

  private aplicarFondo(apariencia: PreferenciasApariencia, oscuro: boolean): void {
    const fondo = fondoEfectivo(apariencia);

    // La foto institucional se deja resolver por `tokens.css`: ahí viven sus
    // dos variantes de escritorio y el velo del tema oscuro.
    if (fondo.institucional) {
      // `--mis-glass-bg` entra en la lista: si no, volver a la foto dejaría los
      // paneles con la opacidad que se les puso para un fondo plano.
      this.quitar('--mis-wallpaper', '--mis-wallpaper-color', '--mis-wallpaper-velo', '--mis-glass-bg');
      return;
    }

    if (fondo.tipo === 'degradado') {
      this.poner('--mis-wallpaper', fondo.valor);
      this.quitar('--mis-wallpaper-color');
    } else {
      this.poner('--mis-wallpaper', 'none');
      this.poner('--mis-wallpaper-color', fondo.valor);
    }

    // Un fondo elegido a mano se pinta tal cual: el velo existe solo para
    // apagar la foto institucional, y encima de un color plano lo único que
    // haría es ensuciar el tono que el usuario acaba de elegir.
    this.poner('--mis-wallpaper-velo', 'transparent');

    // Sobre un fondo claro en tema oscuro (o al revés) los paneles de vidrio
    // quedan ilegibles: se les devuelve opacidad para que el contenido mande
    // sobre el fondo, no al revés.
    const superficie = oscuro ? 'rgba(22,32,52,0.92)' : 'rgba(255,255,255,0.92)';
    this.poner('--mis-glass-bg', superficie);
  }

  private aplicarAcento(acento: string, oscuro: boolean): void {
    const hover = (oscuro ? aclarar(acento, 0.18) : oscurecer(acento, 0.14)) ?? acento;
    const claro = (oscuro ? mezclar(acento, '#0e1626', 0.84) : aclarar(acento, 0.9)) ?? acento;
    const anillo = hexARgba(acento, 0.35) ?? 'rgba(0, 162, 255, 0.35)';

    this.poner('--mis-accent', acento);
    this.poner('--mis-secondary', acento);
    this.poner('--mis-secondary-hover', hover);
    this.poner('--mis-secondary-light', claro);
    this.poner('--mis-text-on-secondary', textoSobre(acento));
    this.poner('--mis-shadow-focus', `0 0 0 3px ${anillo}`);
  }

  private poner(propiedad: string, valor: string): void {
    this.raiz.style.setProperty(propiedad, valor);
  }

  private quitar(...propiedades: string[]): void {
    for (const propiedad of propiedades) this.raiz.style.removeProperty(propiedad);
  }
}
