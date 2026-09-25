import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/** Los tres estados comparten estructura; solo cambian el token y el texto sólido por tema. */
function botonSemaforo(tipo: 'secondary' | 'success' | 'warning' | 'danger', colorTexto: string) {
  const color = `var(--mis-${tipo})`;
  const fondoClaro = `var(--mis-${tipo}-light)`;
  return {
    background: color,
    hoverBackground: fondoClaro,
    activeBackground: fondoClaro,
    borderColor: color,
    hoverBorderColor: color,
    activeBorderColor: color,
    color: colorTexto,
    hoverColor: color,
    activeColor: color,
    focusRing: { color, shadow: 'none' },
  };
}

const BOTONES_OUTLINED_Y_TEXT = {
  /** Sin fondo sólido, el severity `primary` se dibuja SOBRE el fondo de la página: va con `--mis-primary-text`, no con `--mis-primary`. */
  primary: {
    hoverBackground: 'var(--mis-primary-light)',
    activeBackground: 'var(--mis-primary-light)',
    borderColor: 'var(--mis-primary-text)',
    color: 'var(--mis-primary-text)',
  },
  secondary: botonSemaforoLigero('secondary'),
  success: botonSemaforoLigero('success'),
  warn: botonSemaforoLigero('warning'),
  danger: botonSemaforoLigero('danger'),
};

function botonSemaforoLigero(tipo: 'secondary' | 'success' | 'warning' | 'danger') {
  const color = `var(--mis-${tipo})`;
  const fondoClaro = `var(--mis-${tipo}-light)`;
  return { hoverBackground: fondoClaro, activeBackground: fondoClaro, borderColor: color, color };
}

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
        focusRing: { color: 'var(--mis-primary)', shadow: 'none' },
      },
      secondary: botonSemaforo('secondary', colorTextoSemaforo),
      success: botonSemaforo('success', colorTextoSemaforo),
      warn: botonSemaforo('warning', colorTextoSemaforo),
      danger: botonSemaforo('danger', colorTextoSemaforo),
    },
    outlined: BOTONES_OUTLINED_Y_TEXT,
    text: BOTONES_OUTLINED_Y_TEXT,
  };
}

/** La escala neutral de Aura coincide entre temas salvo el nivel 100. */
const SUPERFICIE_COMPARTIDA = {
  0: '#ffffff',
  50: '#f8fafc',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
  950: '#020617',
};

const FONDO_ENCABEZADO_TABLA = {
  background: 'var(--mis-panel-bg)',
  borderColor: 'var(--mis-border-strong)',
  color: 'var(--mis-text-primary)',
};

/** Aura declara estos valores por esquema; se repiten las referencias, no los valores. */
const ESQUEMA_TABLA = {
  root: { borderColor: 'var(--mis-border-strong)' },
  row: { stripedBackground: 'var(--mis-panel-bg)' },
  bodyCell: { selectedBorderColor: 'var(--mis-primary)' },
};

/** Todos los campos de PrimeNG parten de estos tokens; el material visual se
 * completa en `componentes/controles.css` para que input y select compartan
 * la misma superficie de vidrio. */
const CAMPOS = {
  background: 'var(--mis-field-bg)',
  filledBackground: 'var(--mis-field-bg)',
  filledHoverBackground: 'var(--mis-field-bg-hover)',
  filledFocusBackground: 'var(--mis-field-bg-focus)',
  borderColor: 'var(--mis-border-control)',
  hoverBorderColor: 'var(--mis-field-border-hover)',
  focusBorderColor: 'var(--mis-accent)',
  invalidBorderColor: 'var(--mis-danger)',
  color: 'var(--mis-text-primary)',
  disabledColor: 'var(--mis-text-tertiary)',
  placeholderColor: 'var(--mis-text-tertiary)',
  shadow: 'none',
  borderRadius: 'var(--mis-radius-md)',
  focusRing: { width: '0', style: 'none', color: 'transparent', offset: '0', shadow: 'none' },
};

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
      950: '#0F1E3D',
    },
    colorScheme: {
      light: {
        formField: CAMPOS,
        surface: {
          ...SUPERFICIE_COMPARTIDA,
          100: '#f4f6f9',
        },
        primary: {
          color: '{primary.800}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.900}',
          activeColor: '{primary.950}',
        },
        highlight: {
          background: '{primary.50}',
          focusBackground: '{primary.100}',
          color: '{primary.700}',
          focusColor: '{primary.800}',
        },
      },
      dark: {
        formField: CAMPOS,
        surface: {
          ...SUPERFICIE_COMPARTIDA,
          100: '#f1f5f9',
        },
        primary: {
          color: '{primary.400}',
          contrastColor: '{surface.900}',
          hoverColor: '{primary.300}',
          activeColor: '{primary.200}',
        },
        highlight: {
          background: 'rgba(255,255,255,.04)',
          focusBackground: 'rgba(255,255,255,.12)',
          color: 'rgba(255,255,255,.87)',
          focusColor: 'rgba(255,255,255,.87)',
        },
      },
    },
  },
  components: {
    /**
     * Las tablas siguen los tokens del Host: `--mis-surface` en las filas,
     * `--mis-panel-bg` en encabezado y pie, y `--mis-border*` en las
     * divisiones. Un solo bloque sirve para los dos temas porque son las
     * propias variables CSS las que cambian con `.dark` en <html>.
     *
     * Antes las filas se pintaban con el gris casi negro de Aura (#020617),
     * ajeno al navy del resto del shell, y sus divisores quedaban en 1.3:1
     * contra ese fondo — la retícula se perdía en oscuro.
     */
    datatable: {
      header: FONDO_ENCABEZADO_TABLA,
      headerCell: {
        background: 'var(--mis-panel-bg)',
        hoverBackground: 'var(--mis-hover-bg)',
        selectedBackground: 'var(--mis-primary-light)',
        borderColor: 'var(--mis-border-strong)',
        color: 'var(--mis-text-primary)',
        hoverColor: 'var(--mis-text-primary)',
        selectedColor: 'var(--mis-text-primary)',
      },
      row: {
        background: 'var(--mis-surface)',
        hoverBackground: 'var(--mis-table-row-hover-bg)',
        selectedBackground: 'var(--mis-primary-light)',
        color: 'var(--mis-text-primary)',
        hoverColor: 'var(--mis-text-primary)',
        selectedColor: 'var(--mis-text-primary)',
      },
      // El divisor entre filas es el normal, no el fuerte: el fuerte encuadra
      // la tabla y separa encabezado de cuerpo, y usarlo en cada fila
      // devolvería la retícula dura que se quiere evitar.
      bodyCell: { borderColor: 'var(--mis-border)' },
      footer: FONDO_ENCABEZADO_TABLA,
      footerCell: FONDO_ENCABEZADO_TABLA,
      sortIcon: {
        color: 'var(--mis-text-tertiary)',
        hoverColor: 'var(--mis-text-primary)',
      },
      /**
       * Aura declara estos tres SOLO por esquema de color, y lo que declara por
       * esquema le gana a lo de arriba. Ambos temas comparten la estructura y
       * las variables `--mis-*` resuelven el color efectivo.
       */
      colorScheme: {
        light: ESQUEMA_TABLA,
        dark: ESQUEMA_TABLA,
      },
    },
    /** Forma y densidad del control en el preset; el relieve visual vive en `assets/styles/componentes/botones.css`. */
    button: {
      root: {
        borderRadius: 'var(--mis-radius-full)',
        roundedBorderRadius: 'var(--mis-radius-full)',
        gap: 'var(--mis-space-2)',
        paddingX: 'var(--mis-space-4)',
        paddingY: '10px',
        iconOnlyWidth: '44px',
        sm: { paddingX: 'var(--mis-space-3)', paddingY: '8px', iconOnlyWidth: '40px' },
        lg: { paddingX: 'var(--mis-space-5)', paddingY: '12px', iconOnlyWidth: '48px' },
        label: { fontWeight: '600' },
        raisedShadow: 'var(--mis-shadow-sm)',
      },
      colorScheme: {
        light: botonColorScheme('#ffffff'),
        dark: botonColorScheme('var(--mis-text-on-secondary)'),
      },
    },
  },
});
