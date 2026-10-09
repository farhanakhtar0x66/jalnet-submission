import { useState } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { Button } from "../Button";
import { AppText, PageScroll, ScreenHeader } from "../design";
import { Icon } from "../Icon";
import { useTheme } from "../theme/ThemeProvider";
import { MyWater } from "./MyWater";
import { WaterStress } from "./WaterStress";
import { VisionPreview } from "./VisionPreview";

const tabs = [
  { id: "tank", label: "My Water", icon: "tank" },
  { id: "stress", label: "Stress", icon: "activity" },
  { id: "vision", label: "Vision", icon: "truck" },
] as const;

export function WaterHub({ close }: { close: () => void }) {
  const { colors } = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const compactTabs = width < 360 || fontScale > 1.25;
  const [screen, setScreen] = useState<"tank" | "stress" | "vision">("tank");
  return (
    <PageScroll contentContainerStyle={styles.body}>
      <ScreenHeader
        title="Your water"
        eyebrow="JALNET"
        subtitle="Your tank, demo signals & what’s next."
        onClose={close}
      />
      <View
        style={[
          styles.nav,
          { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
        ]}
        accessibilityRole="tablist"
      >
        {tabs.map(({ id, label, icon }) => {
          const selected = screen === id;
          return (
            <Pressable
              key={id}
              accessibilityRole="tab"
              accessibilityLabel={
                id === "stress"
                  ? "Water Stress demo indicator"
                  : id === "vision"
                    ? "TankerOS and HeatSafe previews"
                    : label
              }
              accessibilityState={{ selected }}
              onPress={() => setScreen(id)}
              style={({ pressed }) => [
                styles.tab,
                compactTabs && styles.compactTab,
                {
                  backgroundColor: selected ? colors.surface : "transparent",
                  borderColor: selected ? colors.border : "transparent",
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <Icon
                name={icon}
                size={18}
                color={selected ? colors.primary : colors.muted}
              />
              <AppText
                variant="label"
                tone={selected ? "primary" : "muted"}
                style={styles.tabLabel}
              >
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      {screen === "tank" ? (
        <MyWater />
      ) : screen === "stress" ? (
        <WaterStress />
      ) : (
        <VisionPreview />
      )}
      <Button
        title="Close / return to map"
        icon="map"
        variant="secondary"
        onPress={close}
      />
    </PageScroll>
  );
}

const styles = StyleSheet.create({
  body: { padding: 22, gap: 22, paddingBottom: 32 },
  nav: {
    flexDirection: "row",
    gap: 4,
    padding: 4,
    borderRadius: 18,
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    minHeight: 48,
    borderRadius: 13,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  tabLabel: { flexShrink: 1, textAlign: "center" },
  compactTab: { flexDirection: "column" },
});
