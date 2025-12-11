// Chakra UI v3 theme configuration
// This file exports theme tokens that can be used throughout the application
//
// IMPORTANT: Only use the specified Mukuru color tokens:
// - mukuru.primary, mukuru.charcoal, mukuru.grey.mediumDark, mukuru.grey.medium, mukuru.grey.light
// - mukuru.teal, mukuru.white
// - mukuru.background.light, mukuru.background.dark
// - mukuru.cards.white, mukuru.cards.dark
// - mukuru.text.primary, mukuru.text.accent, mukuru.text.inverse, mukuru.text.input
// - mukuru.text.error, mukuru.text.error.dark, mukuru.text.success, mukuru.text.alert
// - mukuru.buttons.primary, mukuru.buttons.secondary, mukuru.buttons.inverse, mukuru.buttons.link
// - mukuru.buttons.inactive.orange, mukuru.buttons.inactive.grey, mukuru.buttons.inactive.charcoal
// - mukuru.buttons.inactive.teal, mukuru.buttons.inactive.smokeGrey
// - mukuru.state.hover, mukuru.state.hover.card

// Base color values from Mukuru design system
const mukuruBaseColors = {
  orange: {
    100: '#FFC5B5',
    200: '#F05423', // mukuru.primary
    300: '#FC4F1E',
    400: '#FFDBD0',
    500: '#FDECE9',
  },
  grey: {
    100: '#F3F2F2',
    200: '#E9E9EA', // mukuru.grey.light, mukuru.background.light
    300: '#8C8C8C', // mukuru.grey.medium
    350: '#828282', // mukuru.buttons.inactive.smokeGrey, mukuru.text.input
    400: '#4A4D4A', // mukuru.grey.mediumDark
    500: '#3E3E3E', // mukuru.cards.dark
    600: '#373A36', // mukuru.charcoal, mukuru.text.primary
    700: '#222222', // mukuru.background.dark
    800: '#BBBBBB',
  },
  teal: {
    100: '#99DBDA', // mukuru.text.success
    200: '#71DBD4',
    300: '#00A5A3', // mukuru.teal, mukuru.buttons.link
    400: '#DBF0EE',
    500: '#E3F8F6',
  },
  red: {
    100: '#FF6469', // mukuru.text.error.dark
    200: '#DF4239',
    300: '#D10007', // mukuru.text.error
    400: '#F8CECB',
    500: '#FCEDEC',
    600: '#F11313',
    700: '#F8E3E3',
  },
  yellow: {
    100: '#FF9900', // mukuru.text.alert
    200: '#FEF9E9',
    300: '#DFB10A',
    400: '#FFF0DA',
    500: '#FFFBEB',
  },
  black: {
    100: '#1D1D1B', // mukuru.buttons.secondary
  },
  white: {
    100: '#FFFFFF', // mukuru.white, mukuru.cards.white, mukuru.text.inverse, mukuru.buttons.inverse
  },
};

// Mukuru semantic color tokens - ONLY these should be used
const mukuruColors = {
  mukuru: {
    primary: mukuruBaseColors.orange[200], // #F05423
    charcoal: mukuruBaseColors.grey[600], // #373A36
    grey: {
      mediumDark: mukuruBaseColors.grey[400], // #4A4D4A
      medium: mukuruBaseColors.grey[300], // #8C8C8C
      light: mukuruBaseColors.grey[200], // #E9E9EA
    },
    teal: mukuruBaseColors.teal[300], // #00A5A3
    white: mukuruBaseColors.white[100], // #FFFFFF
    background: {
      light: mukuruBaseColors.grey[200], // #E9E9EA
      dark: mukuruBaseColors.grey[700], // #222222
    },
    cards: {
      white: mukuruBaseColors.white[100], // #FFFFFF
      dark: mukuruBaseColors.grey[500], // #3E3E3E
    },
    text: {
      primary: mukuruBaseColors.grey[600], // #373A36
      accent: mukuruBaseColors.orange[200], // #F05423
      inverse: mukuruBaseColors.white[100], // #FFFFFF
      input: mukuruBaseColors.grey[350], // #828282
      error: mukuruBaseColors.red[300], // #D10007
      'error.dark': mukuruBaseColors.red[100], // #FF6469
      success: mukuruBaseColors.teal[100], // #99DBDA
      alert: mukuruBaseColors.yellow[100], // #FF9900
    },
    buttons: {
      primary: mukuruBaseColors.orange[200], // #F05423
      secondary: mukuruBaseColors.black[100], // #1D1D1B
      inverse: mukuruBaseColors.white[100], // #FFFFFF
      link: mukuruBaseColors.teal[300], // #00A5A3
      inactive: {
        orange: mukuruBaseColors.orange[100], // #FFC5B5
        grey: mukuruBaseColors.grey[300], // #8C8C8C
        charcoal: mukuruBaseColors.grey[600], // #373A36
        teal: mukuruBaseColors.teal[100], // #99DBDA
        smokeGrey: mukuruBaseColors.grey[350], // #828282
      },
    },
    state: {
      hover: mukuruBaseColors.grey[100], // #F3F2F2
      'hover.card': mukuruBaseColors.orange[100], // #FFC5B5
    },
  },
};

// Typography
const fonts = {
  heading: "'Madera', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  body: "'Madera', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "'Fira Code', 'Courier New', monospace",
};

// Spacing scale (based on 4px base unit)
const space = {
  px: '1px',
  0: '0',
  0.5: '0.125rem', // 2px
  1: '0.25rem', // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem', // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem', // 12px
  3.5: '0.875rem', // 14px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  7: '1.75rem', // 28px
  8: '2rem', // 32px
  9: '2.25rem', // 36px
  10: '2.5rem', // 40px
  12: '3rem', // 48px
  14: '3.5rem', // 56px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  32: '8rem', // 128px
  40: '10rem', // 160px
  48: '12rem', // 192px
  56: '14rem', // 224px
  64: '16rem', // 256px
};

// Border radius
const radii = {
  none: '0',
  sm: '0.125rem', // 2px
  base: '0.25rem', // 4px
  md: '0.375rem', // 6px
  lg: '0.5rem', // 8px
  xl: '0.75rem', // 12px
  '2xl': '1rem', // 16px
  '3xl': '1.5rem', // 24px
  full: '9999px',
};

// Shadows
const shadows = {
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  outline: '0 0 0 3px rgba(255, 128, 0, 0.5)',
  none: 'none',
};

// Semantic tokens for common use cases - using Mukuru tokens only
const semanticTokens = {
  colors: {
    // Background colors
    'bg.surface': {
      default: 'mukuru.background.light',
      _dark: 'mukuru.background.dark',
    },
    'bg.subtle': {
      default: 'mukuru.grey.light',
      _dark: 'mukuru.background.dark',
    },
    'bg.muted': {
      default: 'mukuru.grey.light',
      _dark: 'mukuru.cards.dark',
    },
    // Border colors
    'border.default': {
      default: 'mukuru.grey.light',
      _dark: 'mukuru.grey.medium',
    },
    'border.muted': {
      default: 'mukuru.grey.medium',
      _dark: 'mukuru.grey.mediumDark',
    },
    // Text colors
    'text.primary': {
      default: 'mukuru.text.primary',
      _dark: 'mukuru.text.inverse',
    },
    'text.secondary': {
      default: 'mukuru.grey.mediumDark',
      _dark: 'mukuru.grey.medium',
    },
    'text.muted': {
      default: 'mukuru.grey.medium',
      _dark: 'mukuru.grey.medium',
    },
    // Status colors - using Mukuru tokens
    'status.error.bg': {
      default: 'mukuru.text.error.dark',
      _dark: 'mukuru.text.error',
    },
    'status.error.border': {
      default: 'mukuru.text.error',
      _dark: 'mukuru.text.error.dark',
    },
    'status.error.text': {
      default: 'mukuru.text.error',
      _dark: 'mukuru.text.error.dark',
    },
    'status.success.bg': {
      default: 'mukuru.text.success',
      _dark: 'mukuru.text.success',
    },
    'status.success.border': {
      default: 'mukuru.teal',
      _dark: 'mukuru.teal',
    },
    'status.success.text': {
      default: 'mukuru.teal',
      _dark: 'mukuru.text.success',
    },
    'status.warning.bg': {
      default: 'mukuru.text.alert',
      _dark: 'mukuru.text.alert',
    },
    'status.warning.border': {
      default: 'mukuru.text.alert',
      _dark: 'mukuru.text.alert',
    },
    'status.warning.text': {
      default: 'mukuru.text.alert',
      _dark: 'mukuru.text.alert',
    },
    'status.info.bg': {
      default: 'mukuru.teal',
      _dark: 'mukuru.teal',
    },
    'status.info.border': {
      default: 'mukuru.teal',
      _dark: 'mukuru.teal',
    },
    'status.info.text': {
      default: 'mukuru.teal',
      _dark: 'mukuru.teal',
    },
  },
};

// Component styles
const components = {
  Button: {
    baseStyle: {
      fontWeight: '600',
      borderRadius: 'md',
    },
    sizes: {
      sm: {
        fontSize: 'sm',
        px: 3,
        py: 2,
      },
      md: {
        fontSize: 'md',
        px: 4,
        py: 2.5,
      },
      lg: {
        fontSize: 'lg',
        px: 6,
        py: 3,
      },
    },
    variants: {
      solid: {
        bg: 'mukuru.buttons.primary',
        color: 'mukuru.white',
        _hover: {
          bg: 'mukuru.state.hover',
        },
        _active: {
          bg: 'mukuru.buttons.primary',
        },
      },
      outline: {
        borderColor: 'mukuru.buttons.primary',
        color: 'mukuru.buttons.primary',
        _hover: {
          bg: 'mukuru.state.hover',
        },
      },
      ghost: {
        color: 'mukuru.buttons.primary',
        _hover: {
          bg: 'mukuru.state.hover',
        },
      },
    },
    defaultProps: {
      colorScheme: 'primary',
    },
  },
  Input: {
    baseStyle: {
      field: {
        borderRadius: 'md',
        borderColor: 'mukuru.grey.medium',
        color: 'mukuru.text.input',
        _focus: {
          borderColor: 'mukuru.buttons.primary',
          boxShadow: 'outline',
        },
      },
    },
  },
  Box: {
    baseStyle: {
      // Default styles for Box component
    },
  },
};

// Export theme tokens for use in components
// Chakra UI v3 components can use these tokens via CSS variables or direct references
export const theme = {
  colors: mukuruColors,
  fonts,
  space,
  radii,
  shadows,
  semanticTokens,
  components,
};

// Export individual tokens for easy access
export {
  mukuruColors as colors,
  fonts,
  space,
  radii,
  shadows,
  semanticTokens,
  components,
};

export default theme;
