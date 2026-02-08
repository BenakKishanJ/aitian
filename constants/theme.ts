/**
 * App Theme Constants
 * 
 * Use these colors throughout the app for consistency.
 * Available as Tailwind classes: bg-purple-500, text-red-500, etc.
 * 
 * Primary Colors:
 * - purple: #7477FF (Primary brand color)
 * - red: #F96857 (Error/danger states)
 * - yellow: #F9CD61 (Tertiary/accent)
 * - gray: #C5D4CA (Secondary/neutral)
 * - cyan: #BCF3FF (Info/blue accent)
 * - black: #232323 (Text and dark elements)
 * - white: #FFFFFF (Backgrounds and light text)
 */

export const colors = {
  purple: {
    DEFAULT: '#7477FF',
    50: '#F0F1FF',
    100: '#E1E3FF',
    200: '#C3C7FF',
    300: '#A5ABFF',
    400: '#878BFF',
    500: '#7477FF',
    600: '#5A5CCC',
    700: '#434599',
    800: '#2D2E66',
    900: '#161733',
    foreground: '#FFFFFF',
  },
  red: {
    DEFAULT: '#F96857',
    50: '#FEF0EE',
    100: '#FDE1DD',
    200: '#FBC3BB',
    300: '#F9A599',
    400: '#F78777',
    500: '#F96857',
    600: '#C75346',
    700: '#953E34',
    800: '#642A23',
    900: '#321511',
    foreground: '#FFFFFF',
  },
  yellow: {
    DEFAULT: '#F9CD61',
    50: '#FEF9E8',
    100: '#FDF3D1',
    200: '#FBE7A3',
    300: '#F9DB75',
    400: '#F7CF47',
    500: '#F9CD61',
    600: '#C7A44E',
    700: '#957B3A',
    800: '#645227',
    900: '#322913',
    foreground: '#232323',
  },
  gray: {
    DEFAULT: '#C5D4CA',
    50: '#F4F7F5',
    100: '#E9F0EB',
    200: '#D3E1D7',
    300: '#C5D4CA',
    400: '#9EADA4',
    500: '#77867D',
    600: '#5A655E',
    700: '#3C443F',
    800: '#1E2220',
    900: '#0F1110',
    foreground: '#232323',
  },
  cyan: {
    DEFAULT: '#BCF3FF',
    50: '#F2FDFF',
    100: '#E5FBFF',
    200: '#CBF7FF',
    300: '#BCF3FF',
    400: '#96ECFF',
    500: '#70E5FF',
    600: '#5AB8CC',
    700: '#438A99',
    800: '#2D5C66',
    900: '#162E33',
    foreground: '#232323',
  },
  black: {
    DEFAULT: '#232323',
    foreground: '#FFFFFF',
  },
  white: {
    DEFAULT: '#FFFFFF',
    foreground: '#232323',
  },
} as const;

// Semantic color mappings
export const semanticColors = {
  primary: colors.purple,
  secondary: colors.gray,
  tertiary: colors.yellow,
  error: colors.red,
  info: colors.cyan,
  success: {
    DEFAULT: '#5AA578',
    foreground: '#FFFFFF',
  },
  warning: {
    DEFAULT: '#FF944B',
    foreground: '#FFFFFF',
  },
} as const;

export default colors;
