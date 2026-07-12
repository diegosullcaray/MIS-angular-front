import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

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
  }
});
