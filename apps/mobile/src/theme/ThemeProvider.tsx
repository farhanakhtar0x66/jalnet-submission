import * as NavigationBar from "expo-navigation-bar";
import * as SystemUI from "expo-system-ui";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform, StatusBar, useColorScheme } from "react-native";
import {
  type AppearancePreference,
  isAppearance,
  resolveTheme,
  systemChromeStyles,
} from "./preference";
import { deviceAppearance } from "./storage";
import { palettes, type ThemeColors, type ThemeMode } from "./tokens";

type ThemeContextValue = {
  colors: ThemeColors;
  mode: ThemeMode;
  appearance: AppearancePreference;
  setAppearance: (value: AppearancePreference) => void;
  saving: boolean;
  preferenceError: string | null;
  openAppearance: () => void;
  closeAppearance: () => void;
  appearanceVisible: boolean;
  ready: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  onReady,
}: {
  children: ReactNode;
  onReady?: () => void;
}) {
  const systemMode = useColorScheme();
  const [appearance, setPreference] = useState<AppearancePreference>("system");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preferenceError, setPreferenceError] = useState<string | null>(null);
  const [appearanceVisible, setAppearanceVisible] = useState(false);
  const revision = useRef(0);
  const mounted = useRef(true);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const mode = resolveTheme(appearance, systemMode);
  const colors = palettes[mode];

  useEffect(() => {
    let active = true;
    mounted.current = true;
    void deviceAppearance.load().then((result) => {
      if (!active || !mounted.current) return;
      if (revision.current === 0) {
        setPreference(result.appearance);
        setPreferenceError(result.error);
      }
      setReady(true);
    });
    return () => {
      active = false;
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (ready) onReadyRef.current?.();
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    const chrome = systemChromeStyles(mode);
    StatusBar.setBarStyle(chrome.statusBar);
    void SystemUI.setBackgroundColorAsync(colors.background).catch(
      () => undefined,
    );
    if (Platform.OS === "android") {
      try {
        NavigationBar.setStyle(chrome.navigationBar);
      } catch {
        // System-bar styling is optional on unsupported Android environments.
      }
    }
  }, [colors.background, mode, ready]);

  const setAppearance = useCallback((value: AppearancePreference) => {
    if (!isAppearance(value)) return;
    const currentRevision = ++revision.current;
    setPreference(value);
    setSaving(true);
    setPreferenceError(null);
    void deviceAppearance.save(value).then(
      () => {
        if (!mounted.current || revision.current !== currentRevision) return;
        setSaving(false);
        setPreferenceError(null);
      },
      () => {
        if (!mounted.current || revision.current !== currentRevision) return;
        setSaving(false);
        setPreferenceError(
          "Appearance changed for this session, but could not be saved. Try again.",
        );
      },
    );
  }, []);

  const openAppearance = useCallback(() => setAppearanceVisible(true), []);
  const closeAppearance = useCallback(() => setAppearanceVisible(false), []);
  const value = useMemo<ThemeContextValue>(
    () => ({
      colors,
      mode,
      appearance,
      setAppearance,
      saving,
      preferenceError,
      openAppearance,
      closeAppearance,
      appearanceVisible,
      ready,
    }),
    [
      colors,
      mode,
      appearance,
      setAppearance,
      saving,
      preferenceError,
      openAppearance,
      closeAppearance,
      appearanceVisible,
      ready,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>
      {ready ? children : null}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error("The app theme is not available.");
  return theme;
}
