import { useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  calculateStress,
  parseStressForm,
  stressDemoFixture,
  stressFactors,
  stressForm,
} from "../../../../packages/domain/src/water-stress";
import { Button } from "../Button";
import { AppText, Card, FormField, StatusPill } from "../design";
import { Icon } from "../Icon";
import { useTheme } from "../theme/ThemeProvider";

export function WaterStress() {
  const { colors } = useTheme();
  const [form, setForm] = useState(() => stressForm(stressDemoFixture()));
  const parsed = parseStressForm(form);
  const result = parsed.valid ? calculateStress(parsed.inputs) : null;
  const incomplete = !result || result.score === null;
  const elevated = result?.band === "HIGH" || result?.band === "CRITICAL";
  const resultTone = incomplete || elevated ? "warning" : "primary";
  const coveragePct = result ? Math.round(result.coverage * 100) : null;
  return (
    <View style={styles.body}>
      <View style={styles.header}>
        <AppText variant="title" accessibilityRole="header">
          Water Stress
        </AppText>
        <AppText tone="muted">
          Explore what contributes to water pressure.
        </AppText>
        <StatusPill label="DEMO INDICATOR" icon="activity" tone="warning" />
      </View>

      <Card
        tone={incomplete || elevated ? "warning" : "accent"}
        style={styles.result}
      >
        <View style={styles.inline}>
          <Icon
            name="activity"
            size={20}
            color={incomplete || elevated ? colors.warning : colors.primary}
          />
          <AppText variant="label" tone={resultTone}>
            DEMO DELHI AREA
          </AppText>
        </View>
        {result?.score !== null && result ? (
          <View style={styles.scoreRow}>
            <View style={styles.score}>
              <AppText variant="metric" tone={resultTone}>
                {result.score}
              </AppText>
              <AppText variant="heading" tone="muted">
                /100
              </AppText>
            </View>
            <StatusPill
              label={`${result.band} · DEMO`}
              tone={elevated ? "warning" : "primary"}
            />
          </View>
        ) : (
          <AppText variant="heading" tone="warning">
            No headline score
          </AppText>
        )}
        <AppText>
          {result?.band === "UNAVAILABLE"
            ? "No sample data. Add pressures below to explore the method."
            : result?.band === "LIMITED_DATA"
              ? "Limited data. At least 60% of weighted inputs is needed for a score."
              : !result
                ? "Correct the invalid inputs below to calculate."
                : "Calculated from fictional sample pressures. Not a supply or safety forecast."}
        </AppText>
        {coveragePct !== null ? (
          <View style={[styles.coverage, { borderTopColor: colors.border }]}>
            <View style={styles.between}>
              <AppText variant="label">Weighted input coverage</AppText>
              <AppText variant="heading">{coveragePct}%</AppText>
            </View>
            <View
              accessible
              accessibilityRole="progressbar"
              accessibilityLabel="Weighted input coverage, not scientific confidence"
              accessibilityValue={{ min: 0, max: 100, now: coveragePct }}
              style={[
                styles.coverageTrack,
                { backgroundColor: colors.surface },
              ]}
            >
              <View
                style={[
                  styles.coverageFill,
                  {
                    width: `${coveragePct}%`,
                    backgroundColor: incomplete
                      ? colors.warning
                      : colors.primary,
                  },
                ]}
              />
            </View>
            <AppText variant="caption" tone="muted">
              Available sample weights, not scientific confidence.
            </AppText>
          </View>
        ) : null}
      </Card>

      <View style={styles.section}>
        <AppText variant="heading" accessibilityRole="header">
          Explore the factors
        </AppText>
        <AppText tone="muted">
          0 is no sample pressure; 100 is maximum. Clear a field for missing
          data. Edits are fictional and reset when this screen reopens.
        </AppText>
      </View>
      {stressFactors.map((factor) => {
        const contribution = result?.contributors.find(
          (item) => item.id === factor.id,
        );
        const pressurePct =
          contribution?.value === null || !contribution
            ? null
            : contribution.value * 100;
        return (
          <Card key={factor.id} style={styles.factor}>
            <FormField
              label={factor.label}
              source="DEMO"
              suffix="/100"
              helper={factor.meaning}
              error={parsed.errors[factor.id]}
              accessibilityLabel={`${factor.label}, demo pressure from 0 to 100; blank means missing`}
              keyboardType="decimal-pad"
              maxLength={20}
              value={form[factor.id]}
              onChangeText={(value) =>
                setForm((current) => ({ ...current, [factor.id]: value }))
              }
            />
            {pressurePct !== null ? (
              <View
                accessible
                accessibilityRole="progressbar"
                accessibilityLabel={`${factor.label}, demo sample pressure`}
                accessibilityValue={{ min: 0, max: 100, now: pressurePct }}
                style={[
                  styles.factorTrack,
                  { backgroundColor: colors.surfaceAlt },
                ]}
              >
                <View
                  style={[
                    styles.factorFill,
                    {
                      width: `${pressurePct}%`,
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              </View>
            ) : null}
            <View style={styles.weightRow}>
              <View style={styles.weight}>
                <AppText variant="caption" tone="muted">
                  Base weight
                </AppText>
                <AppText variant="label">{factor.weight * 100}%</AppText>
              </View>
              {contribution && contribution.value !== null ? (
                <>
                  <View style={styles.weight}>
                    <AppText variant="caption" tone="muted">
                      Effective weight
                    </AppText>
                    <AppText variant="label">
                      {(contribution.effectiveWeight * 100).toFixed(1)}%
                    </AppText>
                  </View>
                  <View style={styles.weight}>
                    <AppText variant="caption" tone="muted">
                      Contribution
                    </AppText>
                    <AppText variant="label" tone="primary">
                      {contribution.contributionPoints?.toFixed(1)} points
                    </AppText>
                  </View>
                </>
              ) : null}
            </View>
            {contribution?.value === null ? (
              <StatusPill label="MISSING · EXCLUDED, NOT ZERO" tone="warning" />
            ) : null}
          </Card>
        );
      })}

      <Card style={styles.method}>
        <AppText variant="heading" accessibilityRole="header">
          Method & limitations
        </AppText>
        <AppText tone="muted">
          Score = 100 × sum(available pressure × base weight) ÷ sum(available
          base weights), rounded to the nearest integer.
        </AppText>
        <AppText tone="muted">
          Missing factors are excluded and weights renormalized. No headline
          score below 60% coverage. Bands: 0–24 Low, 25–49 Moderate, 50–74 High,
          75–100 Critical.
        </AppText>
        <AppText variant="caption" tone="muted">
          Prototype weights and bands are uncalibrated. No live feeds, measured
          water volumes, current timestamps or personal tank inputs are used.
          This indicator doesn’t change incidents, route warnings or droplets,
          and cannot establish safe routes or adequate supply.
        </AppText>
      </Card>
      <Button
        title="Restore Water Stress DEMO inputs"
        variant="secondary"
        icon="refresh"
        onPress={() => setForm(stressForm(stressDemoFixture()))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: 18 },
  header: { gap: 8, alignItems: "flex-start" },
  result: { padding: 22, gap: 16 },
  inline: { flexDirection: "row", alignItems: "center", gap: 8 },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  score: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  coverage: { paddingTop: 16, borderTopWidth: 1, gap: 8 },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: "wrap",
  },
  coverageTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  coverageFill: { height: "100%", borderRadius: 4 },
  section: { gap: 6 },
  factor: { gap: 14 },
  factorTrack: { height: 5, borderRadius: 3, overflow: "hidden" },
  factorFill: { height: "100%", borderRadius: 3 },
  weightRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 18,
    rowGap: 10,
  },
  weight: { minWidth: 66, gap: 3 },
  method: { gap: 12 },
});
