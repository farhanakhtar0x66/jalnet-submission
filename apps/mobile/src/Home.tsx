import {
  eventSchema,
  ledgerEntrySchema,
  savedRouteSchema,
} from "@jalnet/contracts/events";
import { decodePolyline, radiusRing } from "@jalnet/geo";
import {
  Camera,
  type CameraRef,
  GeoJSONSource,
  Layer,
  Map as NativeMap,
  type MapRef,
} from "@maplibre/maplibre-react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { z } from "zod";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AppText,
  Card,
  FormField,
  IconButton,
  LoadingState,
  PageScroll,
  ScreenHeader,
  StateMessage,
  StatusPill,
} from "./design";
import { Icon } from "./Icon";
import { useTheme } from "./theme";
import { localMapStyles } from "./theme/mapStyle";
import { api, isLocal, mobileConfig } from "./api";
import { Button } from "./Button";
import { cachedApi } from "./cache";
import { WaterHub } from "./features/WaterHub";
import { foregroundFix } from "./location";
import { ReportFlow } from "./ReportFlow";
import { SignIn } from "./SignIn";
import { demoCenter, type Layer as LayerName, useUI } from "./ui";

const layers: LayerName[] = ["LIVE", "FLOOD", "LEAKS", "DRAINS", "ROUTE_RISK"];
// The cloud URL/key boundary is unchanged; only LOCAL/DEMO styles follow appearance.
const awsMapStyle =
  mobileConfig?.mode === "aws"
    ? `https://maps.geo.${mobileConfig.EXPO_PUBLIC_AWS_REGION}.amazonaws.com/v2/styles/Monochrome/descriptor?key=${encodeURIComponent(mobileConfig.EXPO_PUBLIC_LOCATION_MAP_KEY)}`
    : null;
const initialMapView = {
  center: [demoCenter.lon, demoCenter.lat] as [number, number],
  zoom: 14,
};
const layerLabels: Record<LayerName, string> = {
  LIVE: "All current reports",
  FLOOD: "Flooding",
  LEAKS: "Water leaks",
  DRAINS: "Drain reports",
  ROUTE_RISK: "Route risk",
};
const publicSchema = eventSchema.extend({
  provenance: z.string(),
  verificationLabel: z.string(),
  freshness: z.enum(["RECENT", "AGING", "EXPIRED"]),
});
const riskSchema = z.object({
  route: savedRouteSchema,
  risks: z.array(
    z.object({
      eventId: z.uuid(),
      warning: z.boolean(),
      message: z.string(),
      score: z.number(),
      intersects: z.boolean(),
    }),
  ),
});
export function Home() {
  const { colors, mode, appearance, openAppearance } = useTheme();
  const insets = useSafeAreaInsets();
  const { height, width, fontScale } = useWindowDimensions();
  const compactMapControls = width < 360 || fontScale > 1.25;
  const [warningHeight, setWarningHeight] = useState(96);
  const mapStyle = isLocal ? localMapStyles[mode] : awsMapStyle;
  const initialized = useUI((s) => s.initialized);
  const reportBusy = useRef(false);
  const setReportBusy = useCallback((value: boolean) => {
    reportBusy.current = value;
  }, []);
  const [displayTime, setDisplayTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setDisplayTime(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  const camera = useRef<CameraRef>(null);
  const map = useRef<MapRef>(null);
  const pin = useUI((s) => s.pin);
  const layer = useUI((s) => s.layer);
  const selected = useUI((s) => s.selected);
  const accuracy = useUI((s) => s.accuracyM);
  const [sheet, setSheet] = useState<
    "camera" | "layers" | "routes" | "profile" | "water" | null
  >(null);
  const [bbox, setBbox] = useState<[number, number, number, number]>([
    77.2, 28.6, 77.22, 28.63,
  ]);
  const pendingBbox = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mapError, setMapError] = useState("");
  const [routeName, setRouteName] = useState("");
  const [origin, setOrigin] = useState<typeof pin | null>(null);
  const [busy, setBusy] = useState(false);
  const eventResult = useQuery({
    queryKey: ["events", bbox, layer],
    queryFn: () =>
      cachedApi(
        `/v1/events?bbox=${bbox.join(",")}&layers=${layer}`,
        z.array(publicSchema),
      ),
  });
  const events = {
    ...eventResult,
    data: eventResult.data?.value
      .filter((event) => Date.parse(event.expiresAt) > displayTime)
      .map((event) => ({
        ...event,
        freshness:
          displayTime - Date.parse(event.lastSeenAt) > 3_600_000
            ? ("AGING" as const)
            : ("RECENT" as const),
      })),
  };
  const routeResult = useQuery({
    queryKey: ["routes"],
    queryFn: () => cachedApi("/v1/routes", z.array(savedRouteSchema)),
  });
  const routes = { ...routeResult, data: routeResult.data?.value };
  const risk = useQuery({
    queryKey: ["risks", routes.data],
    queryFn: () =>
      Promise.all(
        (routes.data ?? []).map((route) =>
          api(`/v1/routes/${route.id}/risk`, riskSchema),
        ),
      ),
    enabled: !!routes.data && !routeResult.data?.fromCache,
  });
  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: () =>
      api(
        "/v1/me",
        z.object({
          userId: z.string(),
          droplets: z.number(),
          ledger: z.array(ledgerEntrySchema),
        }),
      ),
  });
  const cache = useQueryClient();
  useEffect(
    () => () => {
      if (pendingBbox.current) clearTimeout(pendingBbox.current);
    },
    [],
  );
  const act = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      Alert.alert(
        "Unable to complete",
        error instanceof Error ? error.message : "Try again",
      );
    } finally {
      setBusy(false);
    }
  };
  const recenter = () =>
    Alert.alert(
      "Use foreground location?",
      "JalNet uses it to recenter and place a report. You can tap the map to choose a pin instead.",
      [
        { text: "Choose pin", style: "cancel" },
        {
          text: "Continue",
          onPress: () => {
            void act(async () => {
              const permission =
                await Location.requestForegroundPermissionsAsync();
              if (permission.status !== "granted") {
                Alert.alert(
                  "Choose an area",
                  "Location was not granted. Tap the map to choose a pin.",
                );
                return;
              }
              const position = await foregroundFix();
              const point = {
                lat: position.coords.latitude,
                lon: position.coords.longitude,
              };
              useUI.getState().setPin(point, position.coords.accuracy);
              camera.current?.flyTo({
                center: [point.lon, point.lat],
                zoom: 15,
                duration: 800,
              });
            });
          },
        },
      ],
    );
  const feature = events.data?.find((event) => event.id === selected);
  const riskOutdated = displayTime - risk.dataUpdatedAt > 60_000;
  const warnings = (
    routeResult.data?.fromCache ||
    eventResult.data?.fromCache ||
    risk.isError ||
    risk.isFetching ||
    riskOutdated ||
    events.isError
      ? []
      : (risk.data ?? [])
  ).flatMap((r) => r.risks.map((w) => ({ ...w, name: r.route.name })));
  const geo: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: (events.data ?? []).map((event) => ({
      type: "Feature",
      id: event.id,
      properties: {
        eventId: event.id,
        severity: event.severity,
        status: event.status,
        confidence: event.confidence,
        freshness: event.freshness,
      },
      geometry: {
        type: "Point",
        coordinates: [event.location.lon, event.location.lat],
      },
    })),
  };
  const routeGeo: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: (routes.data ?? []).map((route) => ({
      type: "Feature",
      properties: { name: route.name },
      geometry: {
        type: "LineString",
        coordinates: decodePolyline(route.polyline),
      },
    })),
  };
  const closeSheet = () => {
    if (busy || reportBusy.current) return;
    setSheet(null);
    useUI.getState().select(null);
  };
  const openSheet = (value: NonNullable<typeof sheet>) => {
    useUI.getState().select(null);
    setSheet(value);
  };
  const reportedWarning = warnings.find((warning) => warning.warning);
  const needRefresh = !!(
    eventResult.data?.fromCache ||
    routeResult.data?.fromCache ||
    events.isError ||
    routes.isError ||
    (routes.data?.length && riskOutdated)
  );
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 8, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.brandRow}>
          <View
            style={[styles.brandMark, { backgroundColor: colors.primarySoft }]}
          >
            <Icon name="droplets" size={25} />
          </View>
          <View style={styles.grow}>
            <AppText variant="title">JalNet</AppText>
            <StatusPill label={isLocal ? "LOCAL / DEMO" : "AWS · UNVERIFIED"} />
          </View>
        </View>
        <View style={styles.headerActions}>
          <IconButton
            name="user"
            label="Open contributions"
            onPress={() => openSheet("profile")}
          />
          <IconButton
            name="settings"
            label="Appearance settings"
            onPress={openAppearance}
          />
        </View>
      </View>
      <View style={styles.mapArea}>
        {mapStyle ? (
          <NativeMap
            ref={map}
            style={styles.map}
            mapStyle={mapStyle}
            attribution={false}
            logo
            onDidFailLoadingMap={() =>
              setMapError(
                "Basemap unavailable. Check network and map configuration.",
              )
            }
            onPress={(event) => {
              const [lon, lat] = event.nativeEvent.lngLat;
              useUI.getState().setPin({ lat, lon });
            }}
            onRegionDidChange={(event) => {
              const bounds = event.nativeEvent.bounds;
              if (pendingBbox.current) clearTimeout(pendingBbox.current);
              pendingBbox.current = setTimeout(() => {
                const [w, s, e, n] = bounds;
                const dx = (e - w) * 0.1,
                  dy = (n - s) * 0.1;
                const padded: [number, number, number, number] = [
                  Math.max(-180, w - dx),
                  Math.max(-85, s - dy),
                  Math.min(180, e + dx),
                  Math.min(85, n + dy),
                ];
                const rounded = padded.map(
                  (value, index) =>
                    (index < 2
                      ? Math.floor(value * 1000)
                      : Math.ceil(value * 1000)) / 1000,
                ) as typeof padded;
                if (
                  (rounded[2] - rounded[0]) * (rounded[3] - rounded[1]) <=
                    0.04 &&
                  w < e &&
                  s < n
                ) {
                  setBbox(rounded);
                  setMapError("");
                } else
                  setMapError("Zoom in to load incidents in a smaller area.");
              }, 400);
            }}
          >
            <Camera ref={camera} initialViewState={initialMapView} />
            <GeoJSONSource id="routes" data={routeGeo}>
              <Layer
                id="route-lines"
                type="line"
                paint={{
                  "line-color": colors.primary,
                  "line-width": 4,
                  "line-opacity": 0.65,
                }}
              />
            </GeoJSONSource>
            <GeoJSONSource
              id="incident-areas"
              data={{
                type: "FeatureCollection",
                features: (events.data ?? []).map((event) => ({
                  type: "Feature",
                  properties: {},
                  geometry: {
                    type: "Polygon",
                    coordinates: [
                      radiusRing(
                        event.location,
                        event.location.semanticRadiusM,
                      ),
                    ],
                  },
                })),
              }}
            >
              <Layer
                id="incident-area-fill"
                type="fill"
                paint={{ "fill-color": colors.primary, "fill-opacity": 0.12 }}
              />
            </GeoJSONSource>
            <GeoJSONSource
              id="incidents"
              data={geo}
              cluster
              clusterMaxZoom={13}
              onPress={(event) => {
                const feature = event.nativeEvent.features?.[0];
                const id = feature?.properties?.eventId;
                if (typeof id === "string") useUI.getState().select(id);
                else if (feature?.geometry.type === "Point")
                  camera.current?.easeTo({
                    center: feature.geometry.coordinates as [number, number],
                    zoom: 15,
                    duration: 500,
                  });
                event.stopPropagation();
              }}
            >
              <Layer
                id="event-points"
                type="circle"
                paint={{
                  "circle-color": [
                    "case",
                    ["==", ["get", "status"], "ACTIVE"],
                    colors.warning,
                    colors.primary,
                  ],
                  "circle-radius": 9,
                  "circle-opacity": [
                    "case",
                    ["==", ["get", "freshness"], "AGING"],
                    0.45,
                    ["==", ["get", "status"], "MONITORING"],
                    0.6,
                    1,
                  ],
                  "circle-stroke-width": 2,
                  "circle-stroke-color": colors.surface,
                }}
              />
            </GeoJSONSource>
            <GeoJSONSource
              id="report-pin"
              data={{
                type: "Feature",
                properties: {},
                geometry: { type: "Point", coordinates: [pin.lon, pin.lat] },
              }}
            >
              <Layer
                id="pin"
                type="circle"
                paint={{
                  "circle-radius": 6,
                  "circle-color": colors.primary,
                  "circle-stroke-width": 3,
                  "circle-stroke-color": colors.surface,
                }}
              />
            </GeoJSONSource>
          </NativeMap>
        ) : (
          <View style={[styles.map, styles.mapBlocked]}>
            <StateMessage
              title="Map configuration unavailable"
              body="Amazon Location map configuration is blocked awaiting SSO."
              tone="warning"
            />
          </View>
        )}
        <View pointerEvents="box-none" style={styles.pulsePosition}>
          <Card style={styles.pulse}>
            <View style={styles.row}>
              <Icon name="activity" size={18} />
              <AppText variant="label" style={styles.grow}>
                Jal Pulse
              </AppText>
              {events.isFetching ? <Icon name="refresh" size={16} /> : null}
            </View>
            <AppText
              variant="caption"
              tone={
                eventResult.data?.fromCache || events.error || mapError
                  ? "warning"
                  : "muted"
              }
            >
              {eventResult.data?.fromCache
                ? `Offline cache · ${new Date(eventResult.data.cachedAt).toLocaleString()}. Current conditions unknown.`
                : mapError ||
                  events.error?.message ||
                  (events.isFetching
                    ? "Refreshing citizen reports…"
                    : events.data?.length
                      ? `${events.data.length} current citizen reports · tap a marker`
                      : "No current reports. Conditions may still change.")}
            </AppText>
            <AppText variant="caption" tone="muted">
              {initialized
                ? accuracy === null
                  ? "Chosen observation pin"
                  : `Foreground fix · accuracy ~${Math.round(accuracy)} m`
                : "Tap the map to choose an observation pin"}
            </AppText>
          </Card>
        </View>
        {mapStyle ? (
          <View style={styles.attributionPosition}>
            <IconButton
              name="info"
              label="Map attribution and credits"
              onPress={() => {
                void map.current?.showAttribution().catch(() => {
                  setMapError("Map credits could not open. Try again.");
                });
              }}
            />
          </View>
        ) : null}
        <View
          style={[
            styles.mapControls,
            {
              bottom:
                reportedWarning ||
                (routes.data?.length && riskOutdated && !risk.isFetching)
                  ? 72 + warningHeight + 16
                  : 184,
              flexDirection: compactMapControls ? "row" : "column",
            },
          ]}
        >
          <IconButton
            name="layers"
            label="Map layers"
            onPress={() => openSheet("layers")}
          />
          <IconButton
            name="locate"
            label="Use foreground location"
            disabled={busy}
            onPress={recenter}
          />
          {needRefresh ? (
            <IconButton
              name="refresh"
              label="Refresh connection and reports"
              disabled={events.isFetching || routes.isFetching}
              onPress={() => {
                void cache.invalidateQueries();
              }}
            />
          ) : null}
        </View>
        {reportedWarning ? (
          <View
            style={styles.warningPosition}
            onLayout={(event) =>
              setWarningHeight(event.nativeEvent.layout.height)
            }
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open route warning for ${reportedWarning.name}`}
              onPress={() => openSheet("routes")}
            >
              <Card tone="warning" style={styles.warningCard}>
                <Icon name="warning" color={colors.warning} />
                <View style={styles.grow}>
                  <AppText variant="label" tone="warning">
                    {reportedWarning.name}
                  </AppText>
                  <AppText variant="caption" tone="warning">
                    {reportedWarning.message}
                  </AppText>
                </View>
                <Icon name="chevron" color={colors.warning} />
              </Card>
            </Pressable>
          </View>
        ) : routes.data?.length && riskOutdated && !risk.isFetching ? (
          <View
            style={styles.warningPosition}
            onLayout={(event) =>
              setWarningHeight(event.nativeEvent.layout.height)
            }
          >
            <Card style={styles.warningCard}>
              <Icon name="clock" />
              <AppText variant="caption" tone="muted" style={styles.grow}>
                Route check has aged. Refresh before relying on it.
              </AppText>
            </Card>
          </View>
        ) : null}
      </View>
      <View
        style={[
          styles.navigation,
          {
            paddingBottom: Math.max(insets.bottom, 12),
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
        ]}
      >
        <NavAction
          name="map"
          label="Map"
          selected={!sheet && !feature}
          onPress={closeSheet}
        />
        <NavAction
          name="route"
          label="Routes"
          onPress={() => openSheet("routes")}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Camera: capture a private water report"
          onPress={() => openSheet("camera")}
          style={({ pressed }) => [
            styles.cameraAction,
            { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Icon name="camera" color={colors.onPrimary} size={25} />
          <AppText
            variant="caption"
            style={{ color: colors.onPrimary, fontWeight: "700" }}
          >
            Report
          </AppText>
        </Pressable>
        <NavAction
          name="tank"
          label="My Water"
          onPress={() => openSheet("water")}
        />
      </View>
      <Modal
        visible={sheet !== null || !!feature}
        transparent
        animationType="slide"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={closeSheet}
      >
        <View
          style={[
            styles.backdrop,
            { backgroundColor: colors.overlay, paddingTop: insets.top + 10 },
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            accessibilityLabel="Close current panel"
            accessibilityRole="button"
            onPress={closeSheet}
          />
          <View
            style={[
              styles.sheet,
              {
                height: Math.max(240, height - insets.top - 16),
                backgroundColor: colors.background,
                paddingBottom: insets.bottom,
              },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            {sheet === "camera" ? (
              <ReportFlow close={closeSheet} onBusyChange={setReportBusy} />
            ) : sheet === "water" ? (
              <WaterHub close={closeSheet} />
            ) : (
              <>
                <View style={styles.sheetHeading}>
                  <ScreenHeader
                    title={
                      sheet === "layers"
                        ? "Map layers"
                        : sheet === "routes"
                          ? "Saved routes"
                          : sheet === "profile"
                            ? "Your contributions"
                            : (feature?.type.replaceAll("_", " ") ??
                              "Observation")
                    }
                    subtitle={
                      sheet === "profile"
                        ? "Every accepted contribution has a record."
                        : undefined
                    }
                    onClose={closeSheet}
                    closeDisabled={busy}
                  />
                </View>
                <PageScroll>
                  {sheet === "layers" ? (
                    <>
                      <AppText tone="muted">
                        Choose which citizen observations appear on the map.
                      </AppText>
                      {layers.map((value) => (
                        <Button
                          key={value}
                          icon={value === layer ? "check" : "layers"}
                          title={layerLabels[value]}
                          variant="secondary"
                          selected={layer === value}
                          onPress={() => {
                            useUI.getState().setLayer(value);
                            setSheet(null);
                          }}
                        />
                      ))}
                    </>
                  ) : null}
                  {sheet === "routes" ? (
                    <>
                      {isLocal ? (
                        <StateMessage
                          title="LOCAL / DEMO corridors"
                          body="Straight-line intersection fixtures, not calculated road routes or navigation directions."
                          tone="muted"
                        />
                      ) : null}
                      <Card>
                        <View style={styles.row}>
                          <Icon name="route" />
                          <AppText variant="heading">Add a saved route</AppText>
                        </View>
                        <AppText variant="caption" tone="muted">
                          Choose an origin on the map, save it here, then choose
                          a destination and return. Inputs stay here when you
                          close this panel.
                        </AppText>
                        <FormField
                          label="Route name"
                          placeholder="e.g. Morning commute"
                          value={routeName}
                          onChangeText={setRouteName}
                          maxLength={80}
                        />
                        <View style={styles.row}>
                          <StatusPill
                            label={origin ? "Origin chosen" : "Origin needed"}
                          />
                          <StatusPill label="Destination: current pin" />
                        </View>
                        {origin ? (
                          <AppText variant="caption" tone="muted">
                            Origin {origin.lat.toFixed(4)},{" "}
                            {origin.lon.toFixed(4)} · destination{" "}
                            {pin.lat.toFixed(4)}, {pin.lon.toFixed(4)}
                          </AppText>
                        ) : null}
                        <Button
                          title={
                            origin
                              ? "Update origin from current pin"
                              : "Use current pin as origin"
                          }
                          icon="locate"
                          variant="secondary"
                          onPress={() => setOrigin(pin)}
                        />
                        <Button
                          title={
                            busy ? "Saving route…" : "Save route to current pin"
                          }
                          icon="plus"
                          disabled={busy || !origin || !routeName.trim()}
                          onPress={() => {
                            void act(async () => {
                              await api(
                                "/v1/routes",
                                z.object({
                                  route: savedRouteSchema,
                                  provenance: z.string(),
                                }),
                                {
                                  name: routeName,
                                  origin,
                                  destination: pin,
                                  travelMode: "Car",
                                  activeAlerts: true,
                                },
                              );
                              setOrigin(null);
                              setRouteName("");
                              await cache.invalidateQueries();
                            });
                          }}
                        />
                        <Button
                          title="Choose destination on map"
                          icon="map"
                          variant="ghost"
                          disabled={busy}
                          onPress={closeSheet}
                        />
                      </Card>
                      {routes.error ? (
                        <StateMessage
                          title="Routes unavailable"
                          body={routes.error.message}
                          tone="danger"
                        />
                      ) : null}
                      {routes.isFetching ? (
                        <LoadingState label="Loading saved routes…" />
                      ) : null}
                      {routes.data?.length || routes.isError ? (
                        <Button
                          title="Refresh route reports"
                          icon="refresh"
                          variant="secondary"
                          disabled={
                            routes.isFetching ||
                            risk.isFetching ||
                            events.isFetching
                          }
                          onPress={() => {
                            void cache.invalidateQueries();
                          }}
                        />
                      ) : null}
                      {!routes.isPending &&
                      !routes.isError &&
                      !routes.data?.length ? (
                        <StateMessage
                          title="No saved routes yet"
                          body="Choose two map pins to add your first corridor."
                          tone="muted"
                        />
                      ) : null}
                      {(routes.data ?? []).map((route) => {
                        const unavailable = !!(
                          routeResult.data?.fromCache ||
                          eventResult.data?.fromCache ||
                          risk.error ||
                          riskOutdated ||
                          events.isError
                        );
                        const checking = risk.isPending || risk.isFetching;
                        const routeWarnings =
                          risk.data?.find((r) => r.route.id === route.id)
                            ?.risks ?? [];
                        const warned =
                          !unavailable &&
                          !checking &&
                          routeWarnings.some((warning) => warning.warning);
                        return (
                          <Card
                            key={route.id}
                            tone={warned ? "warning" : "default"}
                          >
                            <View style={styles.row}>
                              <Icon name="route" />
                              <AppText variant="heading" style={styles.grow}>
                                {route.name}
                              </AppText>
                            </View>
                            <StatusPill
                              label={
                                unavailable
                                  ? "Current conditions unknown"
                                  : checking
                                    ? "Checking reports"
                                    : warned
                                      ? "Reported hazard"
                                      : "No intersecting reports"
                              }
                              icon={
                                warned
                                  ? "warning"
                                  : unavailable
                                    ? "clock"
                                    : "info"
                              }
                              tone={warned ? "warning" : "muted"}
                            />
                            <AppText variant="caption" tone="muted">
                              {unavailable
                                ? "Route risk unavailable; current conditions unknown."
                                : checking
                                  ? "Checking current route reports…"
                                  : routeWarnings.length
                                    ? "Currently reported observations may affect this route."
                                    : "No intersecting reports found. This does not establish safety."}
                            </AppText>
                            {warned
                              ? routeWarnings
                                  .filter((w) => w.warning)
                                  .map((w) => (
                                    <AppText
                                      key={w.eventId}
                                      variant="caption"
                                      tone="warning"
                                    >
                                      {w.message}
                                    </AppText>
                                  ))
                              : null}
                            <Button
                              title={`Delete ${route.name}`}
                              icon="trash"
                              variant="ghost"
                              disabled={busy}
                              onPress={() => {
                                void act(async () => {
                                  await api(
                                    `/v1/routes/${route.id}`,
                                    z.object({ deleted: z.boolean() }),
                                    undefined,
                                    "DELETE",
                                  );
                                  await cache.invalidateQueries();
                                });
                              }}
                            />
                          </Card>
                        );
                      })}
                    </>
                  ) : null}
                  {sheet === "profile" ? (
                    <>
                      {!isLocal ? (
                        <SignIn />
                      ) : (
                        <StatusPill label="LOCAL / DEMO citizen" icon="user" />
                      )}
                      <Card tone="accent">
                        <View style={styles.row}>
                          <Icon name="droplets" />
                          <AppText variant="label">
                            Contribution droplets
                          </AppText>
                        </View>
                        <AppText variant="metric">
                          {profile.data?.droplets ?? "—"}
                        </AppText>
                        <AppText variant="caption" tone="muted">
                          Submission points are provisional and capped.
                          Meaningful awards require independent supporting
                          evidence.
                        </AppText>
                      </Card>
                      <Card>
                        <AppText variant="heading">Appearance</AppText>
                        <AppText tone="muted">
                          {appearance === "system"
                            ? `System · currently ${mode}`
                            : appearance === "dark"
                              ? "Dark"
                              : "Light"}
                        </AppText>
                        <Button
                          title="System, Light or Dark"
                          icon="settings"
                          variant="secondary"
                          onPress={openAppearance}
                        />
                      </Card>
                      <AppText variant="heading">Contribution history</AppText>
                      {profile.error ? (
                        <StateMessage
                          title="Ledger unavailable"
                          body={profile.error.message}
                          tone="danger"
                        />
                      ) : null}
                      {profile.isFetching ? (
                        <LoadingState label="Loading contribution ledger…" />
                      ) : null}
                      {profile.data?.ledger.length === 0 ? (
                        <StateMessage
                          title="No awards yet"
                          body="Accepted useful contributions appear here."
                          tone="muted"
                        />
                      ) : null}
                      {profile.data?.ledger.map((entry) => (
                        <Card key={entry.id}>
                          <View style={styles.row}>
                            <Icon name="droplets" />
                            <View style={styles.grow}>
                              <AppText variant="label">
                                {entry.reason.replaceAll("_", " ")}
                              </AppText>
                              <AppText variant="caption" tone="muted">
                                {entry.createdAt.slice(0, 10)}
                              </AppText>
                            </View>
                            <AppText variant="heading" tone="primary">
                              {entry.amount > 0 ? "+" : ""}
                              {entry.amount}
                            </AppText>
                          </View>
                        </Card>
                      ))}
                      <AppText variant="caption" tone="muted">
                        People-helped estimates are unavailable until a
                        validated measurement is implemented.
                      </AppText>
                    </>
                  ) : null}
                  {feature ? (
                    <>
                      <StatusPill
                        label={feature.verificationLabel}
                        icon="info"
                      />
                      <Card>
                        <AppText variant="heading">
                          {feature.publicSummary}
                        </AppText>
                        <AppText tone="muted">
                          Severity {feature.severity}/5 · exact depth and road
                          conditions unknown.
                        </AppText>
                      </Card>
                      <StatusPill
                        label={
                          feature.freshness === "RECENT"
                            ? "Recent citizen observation"
                            : feature.freshness === "AGING"
                              ? "Aging · reconfirm conditions"
                              : "Expired · conditions unknown"
                        }
                        tone={
                          feature.freshness === "RECENT" ? "primary" : "warning"
                        }
                        icon="clock"
                      />
                      <Card>
                        <AppText variant="label">Observation details</AppText>
                        <AppText variant="caption" tone="muted">
                          {feature.reportCount} observations · Source: citizen
                          report
                        </AppText>
                        <AppText variant="caption" tone="muted">
                          Last observed:{" "}
                          {new Date(feature.lastSeenAt).toLocaleString()}
                        </AppText>
                        <AppText variant="caption" tone="muted">
                          Expires:{" "}
                          {new Date(feature.expiresAt).toLocaleString()}
                        </AppText>
                        <AppText variant="caption" tone="muted">
                          Approximate affected-area radius:{" "}
                          {feature.location.semanticRadiusM} m, from category
                          policy. This is not measured water extent.
                        </AppText>
                      </Card>
                      <AppText variant="heading">
                        What do you observe now?
                      </AppText>
                      <AppText variant="caption" tone="muted">
                        Independent actions require a current foreground
                        location. Never approach a hazard to verify it.
                      </AppText>
                      {(["CONFIRM", "CLEARED", "NOT_SURE"] as const).map(
                        (action) => (
                          <Button
                            key={action}
                            title={
                              action === "CONFIRM"
                                ? "Still observed"
                                : action === "CLEARED"
                                  ? "Appears cleared"
                                  : "Not sure"
                            }
                            variant="secondary"
                            icon={action === "NOT_SURE" ? "info" : "check"}
                            disabled={busy}
                            onPress={() => {
                              void act(async () => {
                                const permission =
                                  await Location.requestForegroundPermissionsAsync();
                                if (permission.status !== "granted")
                                  throw new Error(
                                    "A current foreground location is required for an independent observation. You can still browse without it.",
                                  );
                                const current = await foregroundFix();
                                if (
                                  current.coords.accuracy === null ||
                                  current.coords.accuracy > 100
                                )
                                  throw new Error(
                                    "Location accuracy must be within 100 m; try later. Never approach a hazard to verify it.",
                                  );
                                await api(
                                  `/v1/events/${feature.id}/confirm`,
                                  z.object({
                                    event: publicSchema,
                                    replay: z.boolean(),
                                  }),
                                  {
                                    action,
                                    location: {
                                      lat: current.coords.latitude,
                                      lon: current.coords.longitude,
                                    },
                                    accuracyM: current.coords.accuracy,
                                    observedAt: new Date().toISOString(),
                                  },
                                );
                                await cache.invalidateQueries();
                              });
                            }}
                          />
                        ),
                      )}
                      <AppText variant="caption" tone="muted">
                        To add independent evidence, close this panel and
                        capture your own current observation.
                      </AppText>
                    </>
                  ) : null}
                  <Button
                    title="Close / return to map"
                    icon="back"
                    variant="ghost"
                    disabled={busy}
                    onPress={closeSheet}
                  />
                </PageScroll>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
function NavAction({
  name,
  label,
  selected = false,
  onPress,
}: {
  name: "map" | "route" | "tank";
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.navItem,
        {
          backgroundColor: selected
            ? colors.primarySoft
            : pressed
              ? colors.surfaceAlt
              : colors.surface,
        },
      ]}
    >
      <Icon name={name} color={selected ? colors.primary : colors.muted} />
      <AppText variant="caption" tone={selected ? "primary" : "muted"}>
        {label}
      </AppText>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
  },
  brandRow: {
    flex: 1,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  brandMark: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  headerActions: { flexDirection: "row", gap: 4 },
  grow: { flex: 1, flexShrink: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  mapArea: { flex: 1 },
  map: { flex: 1 },
  mapBlocked: { padding: 20, justifyContent: "center" },
  pulsePosition: { position: "absolute", left: 16, right: 16, top: 12 },
  pulse: { padding: 12, gap: 4 },
  mapControls: { position: "absolute", right: 16, bottom: 184, gap: 8 },
  attributionPosition: { position: "absolute", right: 12, bottom: 8 },
  warningPosition: { position: "absolute", left: 16, right: 16, bottom: 72 },
  warningCard: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    padding: 12,
    minHeight: 56,
  },
  navigation: {
    paddingTop: 10,
    paddingHorizontal: 16,
    gap: 8,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navItem: {
    flex: 1,
    minHeight: 54,
    paddingHorizontal: 4,
    paddingVertical: 7,
    gap: 3,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraAction: {
    minWidth: 74,
    minHeight: 64,
    padding: 10,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  backdrop: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  sheetHeading: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
});
