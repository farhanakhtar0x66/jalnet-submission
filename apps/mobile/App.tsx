import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";
import { View } from "react-native";
import {
  initialWindowMetrics,
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { configurationError } from "./src/api";
import { PageScroll, ScreenHeader, StateMessage } from "./src/design";
import { Home } from "./src/Home";
import { AppearanceDialog, ThemeProvider, useTheme } from "./src/theme";

void SplashScreen.preventAutoHideAsync().catch(() => undefined);
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 20_000, retry: 1 } },
});
function hideSplash() {
  void SplashScreen.hideAsync().catch(() => undefined);
}
function Content() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  if (configurationError)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          paddingTop: insets.top,
        }}
      >
        <PageScroll>
          <ScreenHeader title="JalNet configuration blocked" icon="shield" />
          <StateMessage
            title="Live configuration needs attention"
            body={configurationError}
            tone="danger"
          />
        </PageScroll>
      </View>
    );
  return (
    <QueryClientProvider client={queryClient}>
      <Home />
    </QueryClientProvider>
  );
}
export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ThemeProvider onReady={hideSplash}>
        <Content />
        <AppearanceDialog />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
