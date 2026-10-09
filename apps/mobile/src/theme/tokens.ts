export type ThemeMode = "light" | "dark";
export type ThemeColors = {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  muted: string;
  border: string;
  primary: string;
  onPrimary: string;
  primarySoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  success: string;
  successSoft: string;
  overlay: string;
};

export const palettes: Record<ThemeMode, ThemeColors> = {
  light: {
    background: "#F5F8FA",
    surface: "#FFFFFF",
    surfaceAlt: "#EDF3F6",
    text: "#102A36",
    muted: "#526977",
    border: "#DCE6EB",
    primary: "#087580",
    onPrimary: "#FFFFFF",
    primarySoft: "#E0F3F5",
    warning: "#8A560B",
    warningSoft: "#FFF2D8",
    danger: "#B83245",
    dangerSoft: "#FFE9ED",
    success: "#176B55",
    successSoft: "#E1F4EC",
    overlay: "rgba(8,18,27,0.55)",
  },
  dark: {
    background: "#101922",
    surface: "#1B2A35",
    surfaceAlt: "#243540",
    text: "#EDF5F8",
    muted: "#ADC0CD",
    border: "#435963",
    primary: "#65D3E2",
    onPrimary: "#102A36",
    primarySoft: "#183E49",
    warning: "#F2BC62",
    warningSoft: "#382D1E",
    danger: "#FFA7AF",
    dangerSoft: "#3A2530",
    success: "#7AD7B3",
    successSoft: "#193A33",
    overlay: "rgba(5,12,18,0.72)",
  },
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;
export const radii = { sm: 12, md: 16, lg: 24, pill: 999 } as const;
export const typography = {
  caption: { fontSize: 12, lineHeight: 18, fontWeight: "400" },
  body: { fontSize: 15, lineHeight: 22, fontWeight: "400" },
  label: { fontSize: 14, lineHeight: 20, fontWeight: "600" },
  title: { fontSize: 22, lineHeight: 29, fontWeight: "700" },
  heading: { fontSize: 28, lineHeight: 35, fontWeight: "700" },
  metric: { fontSize: 40, lineHeight: 48, fontWeight: "700" },
} as const;
