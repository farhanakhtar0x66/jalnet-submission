import {
  Camera,
  Map as NativeMap,
  type MapRef,
} from "@maplibre/maplibre-react-native";
import { useRef, useState } from "react";
import { Modal, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../Button";
import {
  AppText,
  Card,
  IconButton,
  PageScroll,
  ScreenHeader,
  StateMessage,
  StatusPill,
} from "../design";
import { WaterHub } from "../features/WaterHub";
import { useTheme } from "../theme";
import { localMapStyles } from "../theme/mapStyle";
import { previewTankStore } from "./storage";

const initialMapView = {
  center: [77.209, 28.6139] as [number, number],
  zoom: 14,
};

export function PreviewHome() {
  const { colors, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const map = useRef<MapRef>(null);
  const [sheet, setSheet] = useState<"water" | "about" | null>(null);
  const [mapError, setMapError] = useState("");
  const [mapRevision, setMapRevision] = useState(0);
  const close = () => setSheet(null);
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 8, borderBottomColor: colors.border },
        ]}
      >
        <ScreenHeader
          title="JalNet"
          eyebrow="STANDALONE PREVIEW"
          subtitle="Your water, on your device."
          icon="droplets"
        />
      </View>
      <View style={styles.mapArea}>
        <NativeMap
          key={mapRevision}
          ref={map}
          style={styles.map}
          mapStyle={localMapStyles[mode]}
          attribution={false}
          logo
          onDidFailLoadingMap={() =>
            setMapError(
              "The public basemap could not load. Internet is required for map tiles; your water tools still work on-device.",
            )
          }
          onDidFinishLoadingMap={() => setMapError("")}
        >
          <Camera initialViewState={initialMapView} />
        </NativeMap>
        <View style={styles.disclosure} pointerEvents="box-none">
          <Card>
            <StatusPill label="PUBLIC BASEMAP · INTERNET REQUIRED" icon="map" />
            <AppText variant="caption" tone="muted">
              No citizen reports or route warnings are loaded in this preview.
            </AppText>
          </Card>
        </View>
        {mapError ? (
          <View style={styles.mapError}>
            <StateMessage
              title="Map needs attention"
              body={mapError}
              tone="warning"
            >
              <Button
                title="Retry map from initial view"
                icon="refresh"
                variant="secondary"
                onPress={() => {
                  setMapError("");
                  setMapRevision((value) => value + 1);
                }}
              />
            </StateMessage>
          </View>
        ) : null}
        <View style={styles.credits}>
          <IconButton
            name="info"
            label="Map credits and attribution"
            onPress={() => {
              void map.current?.showAttribution().catch(() => {
                setMapError("Map credits could not open. Retry the map.");
              });
            }}
          />
        </View>
      </View>
      <View
        style={[
          styles.navigation,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        <View style={styles.navItem}>
          <Button title="Map" icon="map" variant="ghost" onPress={close} />
        </View>
        <View style={styles.navItem}>
          <Button
            title="Your water"
            icon="tank"
            onPress={() => setSheet("water")}
          />
        </View>
        <View style={styles.navItem}>
          <Button
            title="About"
            icon="info"
            variant="ghost"
            onPress={() => setSheet("about")}
          />
        </View>
      </View>
      <Modal
        visible={sheet !== null}
        transparent
        animationType="slide"
        onRequestClose={close}
        statusBarTranslucent
        navigationBarTranslucent
      >
        <View
          style={[
            styles.backdrop,
            { backgroundColor: colors.overlay, paddingTop: insets.top + 16 },
          ]}
        >
          <View
            accessibilityViewIsModal
            style={[
              styles.sheet,
              {
                height: Math.max(240, height - insets.top - 16),
                backgroundColor: colors.background,
                paddingBottom: insets.bottom,
              },
            ]}
          >
            {sheet === "water" ? (
              <WaterHub close={close} tankStore={previewTankStore} />
            ) : (
              <PageScroll>
                <ScreenHeader
                  title="About this preview"
                  eyebrow="STANDALONE · NONPRODUCTION"
                  onClose={close}
                />
                <Card tone="accent">
                  <AppText variant="heading">Works on your device</AppText>
                  <AppText>
                    My Water calculates and saves your tank inputs locally.
                    Light, Dark and System appearance are saved on this device.
                  </AppText>
                  <AppText variant="caption" tone="muted">
                    Tank values are user-entered or simulated. No live meter or
                    supply forecast is connected. Uninstalling this separate
                    preview app removes its local data.
                  </AppText>
                </Card>
                <Card>
                  <AppText variant="heading">
                    Calculated demo & previews
                  </AppText>
                  <AppText>
                    Water Stress uses fictional sample pressures and resets
                    edits when reopened. TankerOS shows fictional suppliers;
                    HeatSafe is planned. No booking, payment or safety guidance
                    is available.
                  </AppText>
                </Card>
                <StateMessage
                  title="Reporting and routes unavailable"
                  body="Camera capture, private report uploads, incident confirmations, saved routes, route warnings and droplet awards are not available in this standalone preview. No reporting server is configured, and no photograph is collected or uploaded."
                  tone="warning"
                />
                <Card>
                  <AppText variant="heading">
                    Separate server demonstration
                  </AppText>
                  <AppText>
                    The developer setup retains the citizen reporting pipeline
                    with a local Node API and mandatory server-side Cedar
                    authorization. Cedar does not run inside this preview APK.
                    AWS cloud deployment remains live unverified.
                  </AppText>
                </Card>
                <Card>
                  <AppText variant="heading">Map & privacy</AppText>
                  <AppText>
                    The public basemap requires internet. Map providers receive
                    tile requests for the area you browse. This preview has no
                    sign-in, GPS request, automatic analytics or crash-data
                    collection.
                  </AppText>
                  <AppText variant="caption" tone="muted">
                    Map credits are available from the map’s information button.
                    Full map-style and third-party notices accompany the source
                    repository and release documentation.
                  </AppText>
                </Card>
                <Button
                  title="Return to map"
                  icon="back"
                  variant="secondary"
                  onPress={close}
                />
              </PageScroll>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 18, paddingBottom: 10, borderBottomWidth: 1 },
  mapArea: { flex: 1 },
  map: { flex: 1 },
  disclosure: { position: "absolute", top: 12, left: 16, right: 16 },
  mapError: { position: "absolute", bottom: 70, left: 16, right: 16 },
  credits: { position: "absolute", bottom: 12, right: 16 },
  navigation: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 8,
    borderTopWidth: 1,
  },
  navItem: { flex: 1 },
  backdrop: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
});
