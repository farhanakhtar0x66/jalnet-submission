import { Pressable, StyleSheet, Text } from "react-native";
import { Icon, type IconName } from "./Icon";
import { useTheme } from "./theme/ThemeProvider";
import { radii, spacing } from "./theme/tokens";

export function Button({
  title,
  onPress,
  disabled = false,
  accessibilityLabel,
  selected,
  icon,
  variant = "primary",
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  selected?: boolean;
  icon?: IconName;
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const { colors } = useTheme();
  const backgroundColor =
    variant === "primary"
      ? colors.primary
      : variant === "danger"
        ? colors.dangerSoft
        : variant === "secondary"
          ? colors.primarySoft
          : colors.surface;
  const foreground =
    variant === "primary"
      ? colors.onPrimary
      : variant === "danger"
        ? colors.danger
        : colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{
        disabled,
        ...(selected === undefined ? {} : { selected }),
      }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          borderColor: selected ? colors.primary : colors.border,
          borderWidth: variant === "ghost" || selected ? 1 : 0,
        },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {icon ? <Icon name={icon} color={foreground} /> : null}
      <Text style={[styles.label, { color: foreground }]}>{title}</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    minHeight: 48,
    flexDirection: "row",
    gap: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.78 },
  label: {
    fontWeight: "600",
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
    flexGrow: 1,
    flexShrink: 1,
  },
});
