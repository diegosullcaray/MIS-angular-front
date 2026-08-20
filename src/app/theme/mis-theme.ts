import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

/** Colores de botón compartidos por `success`/`warn`/`danger` (root sólido, outlined y text) entre modo claro y oscuro: usan `var(--mis-*)`, así que el mismo bloque sirve para ambos — es la propia variable CSS la que cambia de valor con `.dark` en <html>. */
function botonesSemaforo(colorTexto: string) {
  return {
    success: {
      background: 'var(--mis-success)',
      hoverBackground: 'var(--mis-success-light)',
      activeBackground: 'var(--mis-success-light)',
      borderColor: 'var(--mis-success)',
      hoverBorderColor: 'var(--mis-success)',
      activeBorderColor: 'var(--mis-success)',
      color: colorTexto,
      hoverColor: 'var(--mis-success)',
      activeColor: 'var(--mis-success)',
      focusRing: { color: 'var(--mis-success)', shadow: 'none' }
    },
    warn: {
      background: 'var(--mis-warning)',
      hoverBackground: 'var(--mis-warning-light)',
      activeBackground: 'var(--mis-warning-light)',
      borderColor: 'var(--mis-warning)',
      hoverBorderColor: 'var(--mis-warning)',
      activeBorderColor: 'var(--mis-warning)',
      color: colorTexto,
      hoverColor: 'var(--mis-warning)',
      activeColor: 'var(--mis-warning)',
      focusRing: { color: 'var(--mis-warning)', shadow: 'none' }
    },
    danger: {
      background: 'var(--mis-danger)',
      hoverBackground: 'var(--mis-danger-light)',
      activeBackground: 'var(--mis-danger-light)',
      borderColor: 'var(--mis-danger)',
      hoverBorderColor: 'var(--mis-danger)',
      activeBorderColor: 'var(--mis-danger)',
      color: colorTexto,
      hoverColor: 'var(--mis-danger)',
      activeColor: 'var(--mis-danger)',
      focusRing: { color: 'var(--mis-danger)', shadow: 'none' }
    }
  };
}

const BOTONES_OUTLINED_Y_TEXT = {
  /** Sin fondo sólido, el severity `primary` se dibuja SOBRE el fondo de la página: va con `--mis-primary-text`, no con `--mis-primary`. */
  primary: {
    hoverBackground: 'var(--mis-primary-light)',
    activeBackground: 'var(--mis-primary-light)',
    borderColor: 'var(--mis-primary-text)',
    color: 'var(--mis-primary-text)'
  },
  // El "secondary" de marca toma borde/fondo de --mis-secondary pero el texto navy de --mis-primary-text.
  secondary: {
    hoverBackground: 'var(--mis-secondary-light)',
    activeBackground: 'var(--mis-secondary-light)',
    borderColor: 'var(--mis-secondary)',
    color: 'var(--mis-primary-text)'
  },
  success: {
    hoverBackground: 'var(--mis-success-light)',
    activeBackground: 'var(--mis-success-light)',
    borderColor: 'var(--mis-success)',
    color: 'var(--mis-success)'
  },
  warn: {
    hoverBackground: 'var(--mis-warning-light)',
    activeBackground: 'var(--mis-warning-light)',
    borderColor: 'var(--mis-warning)',
    color: 'var(--mis-warning)'
  },
  danger: {
    hoverBackground: 'var(--mis-danger-light)',
    activeBackground: 'var(--mis-danger-light)',
    borderColor: 'var(--mis-danger)',
    color: 'var(--mis-danger)'
  }
};

function botonColorScheme(colorTextoSemaforo: string) {
  return {
    root: {
      primary: {
        background: 'var(--mis-primary)',
        hoverBackground: 'var(--mis-primary-hover)',
        activeBackground: 'var(--mis-primary-hover)',
        borderColor: 'var(--mis-primary)',
        hoverBorderColor: 'var(--mis-primary-hover)',
        activeBorderColor: 'var(--mis-primary-hover)',
        color: 'var(--mis-text-on-primary)',
        hoverColor: 'var(--mis-text-on-primary)',
        activeColor: 'var(--mis-text-on-primary)',
        focusRing: { color: 'var(--mis-primary)', shadow: 'none' }
      },
      secondary: {
        background: 'var(--mis-secondary)',
        hoverBackground: 'var(--mis-secondary-hover)',
        activeBackground: 'var(--mis-secondary-hover)',
        borderColor: 'var(--mis-secondary)',
        hoverBorderColor: 'var(--mis-secondary-hover)',
        activeBorderColor: 'var(--mis-secondary-hover)',
        color: 'var(--mis-text-on-secondary)',
        hoverColor: 'var(--mis-text-on-secondary)',
        activeColor: 'var(--mis-text-on-secondary)',
        focusRing: { color: 'var(--mis-secondary)', shadow: 'none' }
      },
      ...botonesSemaforo(colorTextoSemaforo)
    },
    outlined: BOTONES_OUTLINED_Y_TEXT,
    text: BOTONES_OUTLINED_Y_TEXT
  };
}

export const MisTheme = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#F0F4FF',
      100: '#E8EDF5',
      200: '#C7D7EC',
      300: '#A1BCE0',
      400: '#759FD1',
      500: '#5285C2',
      600: '#3A68A5',
      700: '#2A4E8F',
      800: '#1D396E', // Base Primary (Navy)
      900: '#162D58', // Hover Primary
      950: '#0F1E3D'
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '#f8fafc',
          100: '#f4f6f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617'
        },
        primary: {
          color: '{primary.800}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.900}',
          activeColor: '{primary.950}'
        },
        highlight: {
          background: '{primary.50}',
          focusBackground: '{primary.100}',
          color: '{primary.700}',
          focusColor: '{primary.800}'
        }
      },
      dark: {
        surface: {
          0: '#ffffff',
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617'
        },
        primary: {
          color: '{primary.400}',
          contrastColor: '{surface.900}',
          hoverColor: '{primary.300}',
          activeColor: '{primary.200}'
        },
        highlight: {
          background: 'rgba(255,255,255,.04)',
          focusBackground: 'rgba(255,255,255,.12)',
          color: 'rgba(255,255,255,.87)',
          focusColor: 'rgba(255,255,255,.87)'
        }
      }
    }
  },
  components: {
    // El borderColor de Aura es casi invisible sobre fondo translúcido: separadores con el tinte navy de --mis-border-strong.
    datatable: {
      colorScheme: {
        light: {
          root: { borderColor: 'rgba(29,57,110,0.18)' }
        },
        dark: {
          root: { borderColor: 'rgba(0,162,255,0.20)' }
        }
      }
    },
    /** Paleta de marca (panel de estilos de botones) en vez de la escala green/orange/red/sky por defecto de Aura para success/warn/danger, y de surface.100-800 para secondary. */
    button: {
      colorScheme: {
        light: botonColorScheme('#ffffff'),
        dark: botonColorScheme('var(--mis-text-on-secondary)')
      }
    }
  }
});
