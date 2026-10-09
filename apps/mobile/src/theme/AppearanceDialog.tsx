import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../Button";
import { AppText, IconButton, StateMessage } from "../design";
import { Icon, type IconName } from "../Icon";
import { type AppearancePreference, appearanceOptions } from "./preference";
import { useTheme } from "./ThemeProvider";
import { radii, spacing } from "./tokens";

const choices: Record<
  AppearancePreference,
  { title: string; description: string; icon: IconName }
> = {
  system: {
    title: "System",
    description: "Follow this device’s appearance",
    icon: "system",
  },
  light: {
    title: "Light",
    description: "Soft surfaces and clear daylight",
    icon: "sun",
  },
  dark: {
    title: "Dark",
    description: "Deep navy with gentle water accents",
    icon: "moon",
  },
};

export function AppearanceDialog() {
  const {
    colors,
    mode,
    appearance,
    setAppearance,
    saving,
    preferenceError,
    appearanceVisible,
    closeAppearance,
  } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal
      transparent
      visible={appearanceVisible}
      animationType="fade"
      onRequestClose={closeAppearance}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View
        style={[
          styles.overlay,
          {
            backgroundColor: colors.overlay,
            paddingTop: insets.top + spacing.lg,
            paddingBottom: insets.bottom + spacing.lg,
          },
        ]}
      >
        <View
          accessibilityViewIsModal
          style={[
            styles.panel,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <AppText variant="title">Appearance</AppText>
                <AppText tone="muted">
                  Make JalNet feel like your device.
                </AppText>
              </View>
              <IconButton
                name="close"
                label="Close Appearance"
                onPress={closeAppearance}
              />
            </View>
            {appearanceOptions.map((value) => {
              const choice = choices[value];
              const selected = appearance === value;
              return (
                <Pressable
                  key={value}
                  accessibilityRole="radio"
                  accessibilityLabel={`${choice.title} appearance`}
                  accessibilityState={{ checked: selected }}
                  onPress={() => setAppearance(value)}
                  style={({ pressed }) => [
                    styles.choice,
                    {
                      backgroundColor: selected
                        ? colors.primarySoft
                        : colors.surface,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <Icon name={choice.icon} size={24} color={colors.primary} />
                  <View style={styles.choiceCopy}>
                    <AppText variant="label">{choice.title}</AppText>
                    <AppText variant="caption" tone="muted">
                      {choice.description}
                    </AppText>
                  </View>
                  {selected ? (
                    <Icon name="check" color={colors.primary} />
                  ) : null}
                </Pressable>
              );
            })}
            <AppText
              variant="caption"
              tone="muted"
              accessibilityLiveRegion="polite"
            >
              {saving
                ? "Saving preference…"
                : appearance === "system"
                  ? `Following device: ${mode}.`
                  : `${choices[appearance].title} selected.`}
            </AppText>
            {preferenceError ? (
              <StateMessage
                title="Preference not saved"
                body={preferenceError}
                tone="warning"
              >
                <Button
                  title="Retry saving preference"
                  icon="refresh"
                  variant="secondary"
                  onPress={() => setAppearance(appearance)}
                />
              </StateMessage>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  panel: {
    maxHeight: "100%",
    width: "100%",
    maxWidth: 560,
    borderWidth: 1,
    borderRadius: radii.lg,
    overflow: "hidden",
  },
  content: { padding: spacing.lg, gap: spacing.md },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  headerCopy: { flex: 1, gap: spacing.xxs },
  choice: {
    minHeight: 76,
    borderWidth: 1,
    borderRadius: radii.md,
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.md,
  },
  choiceCopy: { flex: 1, gap: spacing.xxs },
  pressed: { opacity: 0.75 },
});
