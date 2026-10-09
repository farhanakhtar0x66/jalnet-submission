import { StyleSheet, View } from "react-native";
import { AppText, Card, StatusPill } from "../design";
import { Icon } from "../Icon";
import { useTheme } from "../theme/ThemeProvider";
import { demoSuppliers } from "./demo-data";

export function VisionPreview() {
  const { colors } = useTheme();
  return (
    <View style={styles.body}>
      <View style={styles.header}>
        <AppText variant="title" accessibilityRole="header">
          TankerOS
        </AppText>
        <AppText tone="muted">A preview of supplier discovery.</AppText>
        <StatusPill label="DEMO PREVIEW" icon="truck" tone="warning" />
      </View>
      <AppText tone="muted">
        Fictional suppliers, volumes and prices. No supplier is enrolled or
        contacted. Booking, reservation, order-status simulation and payments
        aren’t implemented.
      </AppText>
      {demoSuppliers.map((supplier) => (
        <Card key={supplier.id} style={styles.supplier}>
          <View style={styles.supplierHeader}>
            <View
              style={[styles.iconTile, { backgroundColor: colors.primarySoft }]}
            >
              <Icon name="truck" color={colors.primary} size={24} />
            </View>
            <View style={styles.supplierName}>
              <AppText variant="heading">{supplier.name}</AppText>
              <StatusPill label="DEMO · FICTIONAL SUPPLIER" tone="warning" />
            </View>
          </View>
          <View style={[styles.metrics, { borderTopColor: colors.border }]}>
            <View style={styles.metric}>
              <AppText variant="caption" tone="muted">
                DEMO tanker volume
              </AppText>
              <AppText variant="heading">
                {supplier.capacityLitres.toLocaleString()} L
              </AppText>
            </View>
            <View style={styles.metric}>
              <AppText variant="caption" tone="muted">
                DEMO sample price
              </AppText>
              <AppText variant="heading">
                ₹{supplier.samplePriceINR.toLocaleString()}
              </AppText>
            </View>
          </View>
          <AppText variant="caption" tone="muted">
            Not a real quote. This preview has no booking action.
          </AppText>
        </Card>
      ))}
      <Card style={styles.planned}>
        <View style={styles.supplierHeader}>
          <View
            style={[styles.iconTile, { backgroundColor: colors.warningSoft }]}
          >
            <Icon name="heat" color={colors.warning} size={24} />
          </View>
          <View style={styles.supplierName}>
            <AppText variant="heading" accessibilityRole="header">
              HeatSafe
            </AppText>
            <StatusPill label="PLANNED" />
          </View>
        </View>
        <AppText>Exploring heat exposure alongside water access.</AppText>
        <AppText tone="muted">
          A future idea requiring verified data and route providers. No heat
          measurements, exposure score, heat-aware routing or live safety
          guidance is implemented.
        </AppText>
      </Card>
      <View style={styles.roadmap}>
        <AppText variant="label" tone="muted">
          FUTURE INTELLIGENCE · PLANNED
        </AppText>
        <AppText variant="caption" tone="muted">
          Verified public-data inputs, optional tank meters and predictive
          features need separate design and validation. This roadmap doesn’t
          promise guaranteed safe routes.
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: 18 },
  header: { gap: 8, alignItems: "flex-start" },
  supplier: { gap: 16 },
  supplierHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  supplierName: { flex: 1, gap: 6, alignItems: "flex-start" },
  metrics: {
    borderTopWidth: 1,
    paddingTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  metric: { flex: 1, minWidth: 110, gap: 5 },
  planned: { gap: 14 },
  roadmap: { gap: 8, paddingHorizontal: 2 },
});
