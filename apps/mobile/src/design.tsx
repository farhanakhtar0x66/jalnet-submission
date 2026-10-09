import { type ReactNode, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  type StyleProp,
  StyleSheet,
  Text,
  type TextInputProps,
  TextInput,
  type TextProps,
  View,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, type IconName } from "./Icon";
import { useTheme } from "./theme/ThemeProvider";
import { radii, spacing, typography } from "./theme/tokens";

export type Tone = "muted" | "primary" | "warning" | "danger" | "success";

export function AppText({
  variant = "body",
  tone,
  style,
  ...props
}: TextProps & { variant?: keyof typeof typography; tone?: Tone }) {
  const { colors } = useTheme();
  return (
    <Text
      {...props}
      style={[
        typography[variant],
        { color: tone ? colors[tone] : colors.text },
        style,
      ]}
    />
  );
}

export function Card({
  children,
  tone = "default",
  style,
}: {
  children: ReactNode;
  tone?: "default" | "accent" | "warning" | "danger";
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const backgroundColor =
    tone === "accent"
      ? colors.primarySoft
      : tone === "warning"
        ? colors.warningSoft
        : tone === "danger"
          ? colors.dangerSoft
          : colors.surface;
  return (
    <View
      style={[
        styles.card,
        { backgroundColor, borderColor: colors.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function StatusPill({
  label,
  tone = "muted",
  icon,
}: {
  label: string;
  tone?: Tone;
  icon?: IconName;
}) {
  const { colors } = useTheme();
  const backgroundColor =
    tone === "muted"
      ? colors.surfaceAlt
      : tone === "primary"
        ? colors.primarySoft
        : tone === "warning"
          ? colors.warningSoft
          : tone === "danger"
            ? colors.dangerSoft
            : colors.successSoft;
  return (
    <View style={[styles.pill, { backgroundColor }]}>
      {icon ? <Icon name={icon} size={14} color={colors[tone]} /> : null}
      <AppText variant="caption" tone={tone} style={styles.pillLabel}>
        {label}
      </AppText>
    </View>
  );
}

export function FormField({
  label,
  helper,
  error,
  source,
  suffix,
  style,
  accessibilityLabel,
  accessibilityHint,
  ...props
}: TextInputProps & {
  label: string;
  helper?: string;
  error?: string;
  source?: string;
  suffix?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <View style={styles.fieldHeading}>
        <AppText variant="label" style={styles.flexText}>
          {label}
        </AppText>
        {source ? <StatusPill label={source} /> : null}
      </View>
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : colors.border,
          },
        ]}
      >
        <TextInput
          {...props}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityHint={
            accessibilityHint ??
            [helper, error, source].filter(Boolean).join(". ")
          }
          placeholderTextColor={colors.muted}
          selectionColor={colors.primary}
          style={[styles.input, { color: colors.text }, style]}
        />
        {suffix ? (
          <AppText variant="label" tone="muted" style={styles.suffix}>
            {suffix}
          </AppText>
        ) : null}
      </View>
      {error ? (
        <AppText
          variant="caption"
          tone="danger"
          accessibilityLiveRegion="polite"
        >
          {error}
        </AppText>
      ) : null}
      {helper ? (
        <AppText variant="caption" tone="muted">
          {helper}
        </AppText>
      ) : null}
    </View>
  );
}

export function IconButton({
  name,
  label,
  onPress,
  disabled = false,
  selected,
  style,
}: {
  name: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{
        disabled,
        ...(selected === undefined ? {} : { selected }),
      }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        {
          backgroundColor: selected ? colors.primarySoft : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
        },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Icon name={name} color={selected ? colors.primary : colors.text} />
    </Pressable>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  eyebrow,
  onClose,
  closeDisabled = false,
  icon,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  onClose?: () => void;
  closeDisabled?: boolean;
  icon?: IconName;
}) {
  const { colors, openAppearance } = useTheme();
  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          {eyebrow ? (
            <AppText variant="caption" tone="primary" style={styles.eyebrow}>
              {eyebrow}
            </AppText>
          ) : null}
          <View style={styles.headingRow}>
            {icon ? (
              <Icon name={icon} size={24} color={colors.primary} />
            ) : null}
            <AppText
              variant="heading"
              accessibilityRole="header"
              style={styles.flexText}
            >
              {title}
            </AppText>
          </View>
        </View>
        <View style={styles.headerActions}>
          <IconButton
            name="settings"
            label="Appearance"
            onPress={openAppearance}
          />
          {onClose ? (
            <IconButton
              name="close"
              label="Close and return to map"
              onPress={onClose}
              disabled={closeDisabled}
            />
          ) : null}
        </View>
      </View>
      {subtitle ? <AppText tone="muted">{subtitle}</AppText> : null}
    </View>
  );
}

export function StateMessage({
  title,
  body,
  tone = "muted",
  children,
}: {
  title: string;
  body?: string;
  tone?: "muted" | "warning" | "danger" | "success";
  children?: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <Card tone={tone === "warning" || tone === "danger" ? tone : "default"}>
      <View style={styles.headingRow}>
        <Icon
          name={tone === "danger" || tone === "warning" ? "warning" : "info"}
          color={colors[tone]}
        />
        <AppText
          variant="label"
          tone={tone}
          style={styles.flexText}
          accessibilityRole={
            tone === "warning" || tone === "danger" ? "alert" : undefined
          }
          accessibilityLiveRegion={
            tone === "warning" || tone === "danger" ? "polite" : "none"
          }
          accessibilityLabel={body ? `${title}. ${body}` : title}
        >
          {title}
        </AppText>
      </View>
      {body ? <AppText tone="muted">{body}</AppText> : null}
      {children}
    </Card>
  );
}

export function LoadingState({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.loading} accessibilityLiveRegion="polite">
      <ActivityIndicator color={colors.primary} />
      <AppText tone="muted" style={styles.flexText}>
        {label}
      </AppText>
    </View>
  );
}

export function PageScroll({
  children,
  contentContainerStyle,
}: {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const container = useRef<View>(null);
  const [keyboardOffset, setKeyboardOffset] = useState(insets.top);
  return (
    <View
      ref={container}
      style={[styles.page, { backgroundColor: colors.background }]}
      onLayout={() => {
        // Keyboard coordinates are screen-relative; a sheet's scroll viewport
        // starts below its safe area/header. Measure that offset instead of
        // assuming the activity's adjustResize also resizes Android Modals.
        container.current?.measureInWindow((_x, y) => {
          if (container.current) setKeyboardOffset(Math.max(0, y));
        });
      }}
    >
      <KeyboardAvoidingView
        style={styles.page}
        behavior="padding"
        keyboardVerticalOffset={keyboardOffset}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={[
            styles.pageContent,
            { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.xl },
            contentContainerStyle,
          ]}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    flexShrink: 1,
    flexWrap: "wrap",
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    gap: spacing.xxs,
  },
  pillLabel: { fontWeight: "600", flexShrink: 1 },
  field: { gap: spacing.xs },
  fieldHeading: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radii.md,
  },
  input: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 17,
    lineHeight: 24,
  },
  suffix: { paddingRight: spacing.md, flexShrink: 1 },
  iconButton: {
    width: 48,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radii.md,
    justifyContent: "center",
    alignItems: "center",
  },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.45 },
  header: { gap: spacing.sm },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  headerCopy: { flex: 1, gap: spacing.xs },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  eyebrow: { letterSpacing: 1, fontWeight: "600" },
  headingRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  flexText: { flexGrow: 1, flexShrink: 1 },
  loading: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  page: { flex: 1 },
  pageContent: { padding: spacing.lg, gap: spacing.lg, flexGrow: 1 },
});
