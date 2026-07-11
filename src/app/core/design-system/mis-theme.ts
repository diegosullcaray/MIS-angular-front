import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * MisTheme — Preset PrimeNG personalizado estilo macOS minimalista.
 * Extiende el preset "Aura" de PrimeNG y sobreescribe los tokens
 * para alinearse con la paleta --mis-* del design system.
 */
export const MisTheme = definePreset(Aura, {
  semantic: {
    primary: {
      50:  '#E8EDF5',
      100: '#C5D3E8',
      200: '#9FB5D4',
      300: '#7898C0',
      400: '#5A82B3',
      500: '#1D396E',   /* --mis-primary */
      600: '#1A3466',
      700: '#162D5C',
      800: '#122652',
      900: '#0A1A3D',
      950: '#060F26',
    },
    colorScheme: {
      light: {
        surface: {
          0:   '#FFFFFF',
          50:  '#F8FAFC',
          100: '#F4F6F9',
          200: '#E8EDF5',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },
        primary: {
          color:           'var(--mis-primary)',
          contrastColor:   'var(--mis-text-on-primary)',
          hoverColor:      'var(--mis-primary-hover)',
          activeColor:     'var(--mis-primary-active)',
        },
        highlight: {
          background:      'var(--mis-primary-light)',
          focusBackground: 'var(--mis-secondary-light)',
          color:           'var(--mis-primary)',
          focusColor:      'var(--mis-primary)',
        },
        focusRing: {
          width:  '2px',
          style:  'solid',
          color:  'var(--mis-accent)',
          offset: '2px',
          shadow: 'var(--mis-shadow-focus)',
        },
        formField: {
          background:        'var(--mis-surface)',
          disabledBackground:'var(--mis-panel-bg)',
          filledBackground:  'var(--mis-panel-bg)',
          borderColor:       'var(--mis-border-strong)',
          hoverBorderColor:  'var(--mis-accent)',
          focusBorderColor:  'var(--mis-accent)',
          invalidBorderColor:'var(--mis-danger)',
          color:             'var(--mis-text-primary)',
          disabledColor:     'var(--mis-text-disabled)',
          placeholderColor:  'var(--mis-text-tertiary)',
          shadow:            'none',
          paddingX:          'var(--mis-space-3)',
          paddingY:          'var(--mis-space-2)',
          borderRadius:      'var(--mis-radius-sm)',
          sm: {
            fontSize:  'var(--mis-text-sm)',
            paddingX:  'var(--mis-space-2)',
            paddingY:  'var(--mis-space-1)',
          },
          lg: {
            fontSize:  'var(--mis-text-lg)',
            paddingX:  'var(--mis-space-4)',
            paddingY:  'var(--mis-space-3)',
          },
        },
        text: {
          color:          'var(--mis-text-primary)',
          hoverColor:     'var(--mis-primary)',
          mutedColor:     'var(--mis-text-secondary)',
          hoverMutedColor:'var(--mis-text-primary)',
        },
        content: {
          background:     'var(--mis-surface)',
          hoverBackground:'var(--mis-panel-bg)',
          borderColor:    'var(--mis-border)',
          color:          'var(--mis-text-primary)',
          hoverColor:     'var(--mis-primary)',
        },
        overlay: {
          select: {
            background:  'var(--mis-surface)',
            borderColor: 'var(--mis-border)',
            borderRadius:'var(--mis-radius-md)',
            color:       'var(--mis-text-primary)',
            shadow:      'var(--mis-shadow-lg)',
          },
          popover: {
            background:  'var(--mis-surface)',
            borderColor: 'var(--mis-border)',
            borderRadius:'var(--mis-radius-lg)',
            color:       'var(--mis-text-primary)',
            shadow:      'var(--mis-shadow-lg)',
          },
          modal: {
            background:  'var(--mis-surface)',
            borderColor: 'transparent',
            borderRadius:'var(--mis-radius-xl)',
            color:       'var(--mis-text-primary)',
            shadow:      'var(--mis-shadow-xl)',
          },
          navigation: {
            shadow:      'var(--mis-shadow-md)',
          },
        },
        list: {
          option: {
            focusBackground:'var(--mis-primary-light)',
            selectedBackground:'var(--mis-secondary-light)',
            selectedFocusBackground:'var(--mis-secondary-light)',
            color:              'var(--mis-text-primary)',
            focusColor:         'var(--mis-primary)',
            selectedColor:      'var(--mis-primary)',
            selectedFocusColor: 'var(--mis-primary)',
            icon: {
              color:      'var(--mis-text-secondary)',
              focusColor: 'var(--mis-primary)',
            },
          },
          optionGroup: {
            background: 'transparent',
            color:      'var(--mis-text-secondary)',
          },
        },
        navigation: {
          item: {
            focusBackground:    'var(--mis-primary-light)',
            activeBackground:   'var(--mis-primary-light)',
            color:              'var(--mis-text-primary)',
            focusColor:         'var(--mis-primary)',
            activeColor:        'var(--mis-primary)',
            icon: {
              color:      'var(--mis-text-secondary)',
              focusColor: 'var(--mis-primary)',
              activeColor:'var(--mis-primary)',
            },
          },
          submenuLabel: {
            background: 'transparent',
            color:      'var(--mis-text-tertiary)',
          },
          submenuIcon: {
            color:      'var(--mis-text-secondary)',
            focusColor: 'var(--mis-primary)',
            activeColor:'var(--mis-primary)',
          },
        },
      },
      dark: {
        primary: {
          color:         'var(--mis-primary)',
          contrastColor: 'var(--mis-text-on-primary)',
          hoverColor:    'var(--mis-primary-hover)',
          activeColor:   '#1D396E',
        },
        highlight: {
          background:      'var(--mis-primary-light)',
          focusBackground: 'var(--mis-secondary-light)',
          color:           'var(--mis-text-primary)',
          focusColor:      'var(--mis-text-primary)',
        },
      },
    },
  },
});

