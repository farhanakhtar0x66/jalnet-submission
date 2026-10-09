import type { TankField } from "@jalnet/contracts/water";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, useWindowDimensions, View } from "react-native";
import {
  calculateTank,
  editTank,
  parseTankForm,
  simulateTankDay,
  type TankForm,
  tankForm,
} from "../../../../packages/domain/src/water";
import { Button } from "../Button";
import {
  AppText,
  Card,
  FormField,
  LoadingState,
  StateMessage,
  StatusPill,
} from "../design";
import { Icon } from "../Icon";
import { useTheme } from "../theme/ThemeProvider";
import { tankStore } from "./storage";
import { useLocalFeature } from "./useLocalFeature";

const fields: {
  key: TankField;
  label: string;
  helper: string;
  suffix: string;
}[] = [
  {
    key: "capacityLitres",
    label: "Tank capacity",
    helper: "Approximate capacity, from 1 to 1,000,000 litres.",
    suffix: "L",
  },
  {
    key: "levelPct",
    label: "Current water level",
    helper: "Your estimate from 0 to 100%; no live meter is connected.",
    suffix: "%",
  },
  {
    key: "dailyUseLitres",
    label: "Daily consumption",
    helper: "0 or 0.01–1,000,000 L/day. Zero means no depletion estimate.",
    suffix: "L/day",
  },
];
export function MyWater() {
  const { colors } = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const stackHero = width < 360 || fontScale > 1.25;
  const state = useLocalFeature(tankStore);
  const sources = state.data
    ? {
        capacityLitres: state.data.capacitySource,
        levelPct: state.data.levelSource,
        dailyUseLitres: state.data.dailyUseSource,
      }
    : null;
  const [form, setForm] = useState<TankForm | null>(null);
  useEffect(() => {
    if (state.data && form === null) setForm(tankForm(state.data));
  }, [state.data, form]);
  const parsed = form ? parseTankForm(form) : null;
  const estimate = parsed?.valid ? calculateTank(parsed.inputs) : null;
  const forecastOrigin =
    state.data?.levelSource === "USER_ENTERED" &&
    state.data.capacitySource === "USER_ENTERED" &&
    state.data.dailyUseSource === "USER_ENTERED"
      ? "USER-ENTERED"
      : "SIMULATED";
  const edit = (field: TankField, text: string) => {
    if (!form || !state.data) return;
    const next = { ...form, [field]: text };
    setForm(next);
    const valid = parseTankForm(next);
    if (valid.valid) state.update(editTank(state.data, valid.inputs, field));
  };
  const reset = () =>
    Alert.alert(
      "Reset My Water demo fixture?",
      "Only this tank is reset: 1,500 L capacity, simulated 60% level, 300 L/day demo consumption. Reports, routes and private drafts are kept.",
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Reset tank only",
          onPress: () => {
            void state.reset().then((value) => {
              if (value) setForm(tankForm(value));
            });
          },
        },
      ],
    );
  return (
    <View style={styles.body}>
      <View style={styles.sectionHeader}>
        <View style={styles.heading}>
          <AppText variant="title" accessibilityRole="header">
            My Water
          </AppText>
          <AppText tone="muted">A clearer view of your tank.</AppText>
        </View>
        <StatusPill label="LOCAL DEVICE" icon="tank" />
      </View>
      {state.loading ? <LoadingState label="Loading saved tank…" /> : null}
      {state.loadError ? (
        <StateMessage
          title="Your tank couldn’t load"
          body={state.loadError}
          tone="danger"
        >
          <Button
            title="Retry loading tank"
            icon="refresh"
            disabled={state.loading}
            onPress={() => {
              setForm(null);
              void state.load();
            }}
          />
        </StateMessage>
      ) : null}
      {!state.loading && !state.loadError && form && state.data ? (
        <>
          {estimate ? (
            <Card tone="accent" style={styles.hero}>
              <View style={[styles.heroRow, stackHero && styles.stackedHero]}>
                <View
                  style={[styles.heroMetric, stackHero && styles.stackedMetric]}
                >
                  <AppText variant="label" tone="primary">
                    WATER REMAINING
                  </AppText>
                  <AppText variant="metric" tone="primary">
                    {estimate.remainingLitres.toLocaleString(undefined, {
                      maximumFractionDigits: 1,
                    })}
                  </AppText>
                  <AppText tone="muted">litres in your tank</AppText>
                  <StatusPill
                    label={`${state.data.levelSource === "SIMULATED" ? "SIMULATED" : "USER-ENTERED"} LEVEL`}
                    icon="droplets"
                  />
                </View>
                {parsed?.valid ? (
                  <View
                    accessible
                    accessibilityLabel={`Tank level ${parsed.inputs.levelPct.toLocaleString(undefined, { maximumFractionDigits: 1 })} percent; ${state.data.levelSource === "SIMULATED" ? "simulated" : "user-entered"}`}
                    style={styles.gaugeColumn}
                  >
                    <View
                      style={[
                        styles.tankLid,
                        { backgroundColor: colors.primary },
                      ]}
                    />
                    <View
                      style={[
                        styles.tank,
                        {
                          borderColor: colors.primary,
                          backgroundColor: colors.surface,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.water,
                          {
                            height: `${parsed.inputs.levelPct}%`,
                            backgroundColor: colors.primary,
                          },
                        ]}
                      />
                      <View style={styles.gaugeMarks}>
                        {[1, 2, 3].map((mark) => (
                          <View
                            key={mark}
                            style={[
                              styles.gaugeMark,
                              { backgroundColor: colors.border },
                            ]}
                          />
                        ))}
                      </View>
                    </View>
                    <AppText variant="heading" tone="primary">
                      {parsed.inputs.levelPct.toLocaleString(undefined, {
                        maximumFractionDigits: 1,
                      })}
                      %
                    </AppText>
                  </View>
                ) : null}
              </View>
              <View
                style={[styles.estimateRow, { borderTopColor: colors.border }]}
              >
                <Icon name="clock" color={colors.primary} size={22} />
                <View style={styles.flex}>
                  <AppText variant="heading">
                    {estimate.status === "EMPTY"
                      ? "Tank is empty"
                      : estimate.hoursRemaining === null
                        ? "No depletion estimate"
                        : `~${estimate.hoursRemaining.toLocaleString(undefined, { maximumFractionDigits: 1 })} hours left`}
                  </AppText>
                  <AppText variant="caption" tone="muted">
                    {estimate.status === "EMPTY"
                      ? "In this entered or simulated state."
                      : estimate.hoursRemaining === null
                        ? "Daily consumption is set to zero."
                        : `Estimated depletion · ~${((estimate.hoursRemaining ?? 0) / 24).toLocaleString(undefined, { maximumFractionDigits: 1 })} days`}
                  </AppText>
                </View>
              </View>
              <AppText variant="caption" tone="muted">
                {forecastOrigin} estimate ·{" "}
                {state.data.dailyUseSource === "DEMO_FIXTURE"
                  ? "DEMO"
                  : "USER-ENTERED"}{" "}
                daily consumption
              </AppText>
            </Card>
          ) : (
            <StateMessage
              title="Check your tank inputs"
              body="Correct the fields below to calculate. Invalid edits aren’t saved; your last valid saved values are kept."
              tone="warning"
            />
          )}
          <Card style={styles.inputs}>
            <View style={styles.inline}>
              <Icon name="tank" color={colors.primary} size={20} />
              <AppText
                variant="heading"
                accessibilityRole="header"
                style={styles.flex}
              >
                Your tank inputs
              </AppText>
            </View>
            {fields.map(({ key, label, helper, suffix }) => (
              <FormField
                key={key}
                label={label}
                helper={helper}
                suffix={suffix}
                source={sources?.[key].replaceAll("_", " ")}
                error={parsed?.errors[key]}
                accessibilityLabel={`${label}, ${suffix}`}
                keyboardType="decimal-pad"
                maxLength={20}
                value={form[key]}
                onChangeText={(text) => edit(key, text)}
              />
            ))}
            <View style={styles.inline} accessibilityLiveRegion="polite">
              <Icon
                name={
                  state.saveStatus === "saved"
                    ? "check"
                    : state.saveStatus === "error"
                      ? "warning"
                      : "device"
                }
                size={16}
                color={
                  state.saveStatus === "error" ? colors.danger : colors.muted
                }
              />
              <AppText
                variant="caption"
                tone={state.saveStatus === "error" ? "danger" : "muted"}
                style={styles.flex}
              >
                {state.saveStatus === "saving"
                  ? "Saving locally…"
                  : state.saveStatus === "saved"
                    ? "Saved on this device."
                    : state.saveStatus === "error"
                      ? "Changes are not saved yet."
                      : "DEMO fixture · edit or reset to save on this device."}
              </AppText>
            </View>
          </Card>
          <Card style={styles.simulation}>
            <View style={styles.inline}>
              <Icon name="activity" color={colors.primary} size={20} />
              <AppText
                variant="heading"
                accessibilityRole="header"
                style={styles.flex}
              >
                Explore a day ahead
              </AppText>
            </View>
            <AppText tone="muted">
              Subtract one day of consumption. This is a simulation; time
              advances only when you tap.
            </AppText>
            <StatusPill
              label={`SIMULATED DAYS: ${state.data.simulatedDays}`}
              icon="clock"
            />
            <Button
              title="Simulate one day of consumption"
              icon="activity"
              disabled={
                !parsed?.valid ||
                state.loading ||
                state.data.simulatedDays >= 36_500
              }
              onPress={() => {
                if (!state.data || !parsed?.valid) return;
                const next = simulateTankDay(state.data);
                state.update(next);
                setForm(tankForm(next));
              }}
            />
          </Card>
        </>
      ) : null}
      {state.saveError ? (
        <StateMessage
          title="Your changes aren’t saved"
          body={state.saveError}
          tone="danger"
        >
          {state.data && !state.loadError ? (
            <Button
              title="Retry saving tank"
              icon="refresh"
              disabled={state.loading || !parsed?.valid}
              onPress={() => {
                if (state.data) state.update(state.data);
              }}
            />
          ) : null}
        </StateMessage>
      ) : null}
      <AppText variant="caption" tone="muted">
        User estimates and simulation only. No IoT or live meter. Assumes
        constant consumption and no refill; this isn’t a guaranteed supply
        forecast.
      </AppText>
      <Button
        title="Reset My Water demo fixture"
        icon="refresh"
        variant="ghost"
        disabled={state.loading}
        onPress={reset}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  body: { gap: 18 },
  sectionHeader: { gap: 10, alignItems: "flex-start" },
  heading: { gap: 4 },
  hero: { gap: 16, padding: 22 },
  heroRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  stackedHero: { flexDirection: "column", alignItems: "stretch" },
  heroMetric: { flex: 1, gap: 8, minWidth: 0, alignItems: "flex-start" },
  stackedMetric: { flex: 0 },
  gaugeColumn: { gap: 5, alignItems: "center", alignSelf: "center", width: 84 },
  tankLid: { width: 38, height: 5, borderRadius: 3 },
  tank: {
    width: 78,
    height: 128,
    borderWidth: 2,
    borderRadius: 18,
    overflow: "hidden",
  },
  water: { position: "absolute", bottom: 0, left: 0, right: 0, opacity: 0.35 },
  gaugeMarks: {
    position: "absolute",
    top: 27,
    bottom: 27,
    right: 9,
    justifyContent: "space-between",
  },
  gaugeMark: { width: 16, height: 2, borderRadius: 1 },
  estimateRow: {
    borderTopWidth: 1,
    paddingTop: 16,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  flex: { flex: 1 },
  inline: { flexDirection: "row", alignItems: "center", gap: 8 },
  inputs: { gap: 20 },
  simulation: { gap: 12, alignItems: "stretch" },
});
