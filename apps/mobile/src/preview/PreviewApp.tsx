import * as SplashScreen from "expo-splash-screen";
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from "react-native-safe-area-context";
import { AppearanceDialog, ThemeProvider } from "../theme";
import { PreviewHome } from "./PreviewHome";

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function PreviewApp() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ThemeProvider
        onReady={() => {
          void SplashScreen.hideAsync().catch(() => undefined);
        }}
      >
        <PreviewHome />
        <AppearanceDialog />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
