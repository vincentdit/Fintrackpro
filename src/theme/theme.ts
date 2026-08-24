/**
 * Design tokens. A single palette drives both light and dark schemes so the
 * whole app stays visually consistent. Access via useTheme().
 */

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryText: string;
  income: string;
  expense: string;
  warning: string;
  success: string;
  overlay: string;
}

export interface Theme {
  dark: boolean;
  colors: ThemeColors;
  spacing: (n: number) => number;
  radius: { sm: number; md: number; lg: number; xl: number };
  font: {
    h1: number;
    h2: number;
    h3: number;
    body: number;
    small: number;
  };
}

const spacing = (n: number) => n * 4;
const radius = { sm: 8, md: 12, lg: 16, xl: 24 };
const font = { h1: 30, h2: 22, h3: 17, body: 15, small: 13 };

export const lightTheme: Theme = {
  dark: false,
  spacing,
  radius,
  font,
  colors: {
    bg: '#F4F6FB',
    surface: '#FFFFFF',
    surfaceAlt: '#EEF1F8',
    border: '#E1E5EF',
    text: '#0B1220',
    textMuted: '#5B6478',
    primary: '#2E6BFF',
    primaryText: '#FFFFFF',
    income: '#1AAE6F',
    expense: '#E5484D',
    warning: '#E5A00D',
    success: '#1AAE6F',
    overlay: 'rgba(11,18,32,0.45)',
  },
};

export const darkTheme: Theme = {
  dark: true,
  spacing,
  radius,
  font,
  colors: {
    bg: '#0B1220',
    surface: '#141C2E',
    surfaceAlt: '#1D2740',
    border: '#26314C',
    text: '#F1F4FB',
    textMuted: '#95A0B8',
    primary: '#4C82FF',
    primaryText: '#FFFFFF',
    income: '#33C88A',
    expense: '#FF6169',
    warning: '#F2B84B',
    success: '#33C88A',
    overlay: 'rgba(0,0,0,0.6)',
  },
};
