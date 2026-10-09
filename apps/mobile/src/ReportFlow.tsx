import { reportSchema } from "@jalnet/contracts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetch as nativeFetch } from "expo/fetch";
import { CameraView, useCameraPermissions } from "expo-camera";
import { File, Paths } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Image, Linking, StyleSheet, Switch, View } from "react-native";
import { z } from "zod";
import { api, isLocal, storageScope } from "./api";
import { Button } from "./Button";
import {
  AppText,
  Card,
  FormField,
  LoadingState,
  PageScroll,
  ScreenHeader,
  StateMessage,
  StatusPill,
} from "./design";
import { clearDraft, type LocalDraft, readDraft, saveDraft } from "./drafts";
import { useTheme } from "./theme";
import { useUI } from "./ui";

const categories = [
  "WATERLOGGING",
  "FLOOD",
  "LEAK",
  "DRAIN_BLOCKAGE",
  "DRAIN_OVERFLOW",
] as const;
const confirmationResult = z.object({
  eventId: z.uuid(),
  replay: z.boolean(),
  report: reportSchema,
});
const categoryLabels: Record<(typeof categories)[number], string> = {
  WATERLOGGING: "Waterlogging",
  FLOOD: "Flooding",
  LEAK: "Water leak",
  DRAIN_BLOCKAGE: "Blocked drain",
  DRAIN_OVERFLOW: "Drain overflow",
};
export function ReportFlow({
  close,
  onBusyChange,
}: {
  close: () => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [draft, setDraft] = useState<LocalDraft | null>(null);
  const [draftLoading, setDraftLoading] = useState(true);
  const [draftLoadFailed, setDraftLoadFailed] = useState(false);
  const mounted = useRef(false);
  const draftLoadRequest = useRef(0);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [finishRequested, setFinishRequested] = useState(false);
  const [success, setSuccess] = useState<{
    response: z.infer<typeof confirmationResult>;
    publicRoad: boolean;
  } | null>(null);
  const [error, setError] = useState("");
  const [category, setCategory] =
    useState<(typeof categories)[number]>("WATERLOGGING");
  const [severity, setSeverity] = useState<1 | 2 | 3 | 4>(2);
  const [note, setNote] = useState("");
  const [publicRoad, setPublicRoad] = useState(false);
  const [active, setActive] = useState(false);
  const pinChosen = useUI((s) => s.initialized);
  const pin = useUI((s) => s.pin);
  const accuracy = useUI((s) => s.accuracyM);
  const queryClient = useQueryClient();
  const analysisPollStarted = useRef(Date.now());
  useEffect(() => {
    onBusyChange?.(busy);
    return () => onBusyChange?.(false);
  }, [busy, onBusyChange]);
  useEffect(() => {
    if (finishRequested && !busy) close();
  }, [finishRequested, busy, close]);
  useEffect(() => {
    if (draft?.reportId) analysisPollStarted.current = Date.now();
  }, [draft?.reportId]);
  const loadDraft = useCallback(async () => {
    const request = ++draftLoadRequest.current;
    setDraftLoading(true);
    setDraftLoadFailed(false);
    try {
      const draft = await readDraft();
      if (!mounted.current || request !== draftLoadRequest.current) return;
      setDraft(draft);
      if (draft?.location && !useUI.getState().initialized)
        useUI
          .getState()
          .setPin(
            { lat: draft.location.lat, lon: draft.location.lon },
            draft.location.accuracyM ?? null,
          );
    } catch (e) {
      if (!mounted.current || request !== draftLoadRequest.current) return;
      setError(String(e));
      setDraftLoadFailed(true);
    } finally {
      if (mounted.current && request === draftLoadRequest.current)
        setDraftLoading(false);
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    void loadDraft();
    return () => {
      mounted.current = false;
    };
  }, [loadDraft]);
  const report = useQuery({
    queryKey: ["report", draft?.reportId],
    queryFn: () =>
      api(
        `/v1/reports/${draft?.reportId}`,
        reportSchema,
        undefined,
        "GET",
        draft?.accountScope,
      ),
    enabled: !!draft?.reportId,
    refetchInterval: (query) =>
      query.state.data?.status === "ANALYZING" &&
      Date.now() - analysisPollStarted.current < 120_000
        ? 1200
        : false,
  });
  const act = async (operation: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    onBusyChange?.(true);
    setBusy(true);
    setError("");
    try {
      await operation();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      busyRef.current = false;
      onBusyChange?.(false);
      setBusy(false);
    }
  };
  const capture = () =>
    act(async () => {
      const accountScope = await storageScope();
      if (!useUI.getState().initialized)
        throw new Error(
          "Choose an observation pin on the map or use foreground location before capturing evidence",
        );
      const photo = await camera.current?.takePictureAsync({
        quality: 0.85,
        exif: false,
      });
      if (!photo) throw new Error("Camera did not return an image");
      const context = ImageManipulator.manipulate(photo.uri);
      context.resize(
        photo.width > photo.height ? { width: 1280 } : { height: 1280 },
      );
      const rendered = await context.renderAsync();
      const image = await rendered.saveAsync({
        format: SaveFormat.JPEG,
        compress: 0.7,
      });
      const source = new File(image.uri);
      if (source.size > 3_750_000)
        throw new Error("Image exceeds 3.75 MB; retake closer");
      const file = new File(Paths.document, `report-${Date.now()}.jpg`);
      source.copy(file);
      const next = {
        accountScope,
        uri: file.uri,
        capturedAt: new Date().toISOString(),
        location: {
          ...pin,
          source:
            accuracy === null
              ? ("USER_PIN" as const)
              : ("CURRENT_LOCATION" as const),
          ...(accuracy === null ? {} : { accuracyM: accuracy }),
        },
      };
      await saveDraft(next);
      setDraft(next);
    });
  const upload = () =>
    act(async () => {
      if (!draft) return;
      if (draft.accountScope !== (await storageScope()))
        throw new Error("Account changed; original private draft was kept");
      let current = draft;
      const scopedApi = <T,>(
        path: string,
        schema: z.ZodType<T>,
        body?: unknown,
      ) =>
        api(
          path,
          schema,
          body,
          body === undefined ? "GET" : "POST",
          current.accountScope,
        );
      if (!current.reportId) {
        const created = await scopedApi("/v1/reports", reportSchema, {
          action: "DRAFT",
          capturedAt: current.capturedAt,
          location: current.location ?? {
            ...pin,
            source: "USER_PIN",
            ...(accuracy === null ? {} : { accuracyM: accuracy }),
          },
        });
        current = { ...current, reportId: created.id };
        await saveDraft(current);
        setDraft(current);
      }
      const latest = await scopedApi(
        `/v1/reports/${current.reportId}`,
        reportSchema,
      );
      if (latest.status === "ANALYZING") {
        analysisPollStarted.current = Date.now();
        // Completion may have committed before SQS scheduling failed. Retrying
        // this action reschedules the same owned report; the worker lease prevents
        // concurrent duplicate analysis. Do not create/upload a replacement.
        await scopedApi("/v1/reports", reportSchema, {
          action: "UPLOAD_COMPLETE",
          reportId: current.reportId,
        });
        queryClient.setQueryData(["report", current.reportId], latest);
        return;
      }
      if (!["DRAFT", "UPLOADING"].includes(latest.status)) {
        queryClient.setQueryData(["report", current.reportId], latest);
        return;
      }
      const file = new File(current.uri);
      const presign = await scopedApi(
        "/v1/uploads/presign",
        z.object({ url: z.url(), expiresIn: z.number(), reportId: z.uuid() }),
        {
          reportId: current.reportId,
          contentType: "image/jpeg",
          contentLength: file.size,
        },
      );
      const response = await nativeFetch(presign.url, {
        method: "PUT",
        headers: { "Content-Type": "image/jpeg" },
        body: file,
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok)
        throw new Error("Private upload failed; your draft is saved for retry");
      await scopedApi("/v1/reports", reportSchema, {
        action: "UPLOAD_COMPLETE",
        reportId: current.reportId,
      });
      queryClient.setQueryData(
        ["report", current.reportId],
        await scopedApi(`/v1/reports/${current.reportId}`, reportSchema),
      );
    });
  const confirm = () =>
    act(async () => {
      if (!draft?.reportId) return;
      const response = await api(
        `/v1/reports/${draft.reportId}/confirm`,
        confirmationResult,
        {
          category,
          severity,
          location: { lat: pin.lat, lon: pin.lon },
          stillActive: true,
          note,
          publicRoad,
        },
        "POST",
        draft.accountScope,
      );
      await clearDraft(draft.accountScope);
      const file = new File(draft.uri);
      if (file.exists) file.delete();
      await queryClient.invalidateQueries();
      setSuccess({ response, publicRoad });
      setDraft(null);
    });
  const reset = () =>
    Alert.alert(
      "Discard saved draft?",
      "The local image will be deleted. Uploaded private evidence follows retention policy.",
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            void act(async () => {
              if (draft) await clearDraft(draft.accountScope);
              if (draft) {
                const file = new File(draft.uri);
                if (file.exists) file.delete();
              }
              setDraft(null);
            });
          },
        },
      ],
    );
  const stage = success
    ? "Report received"
    : report.data?.status === "NEEDS_CONFIRMATION"
      ? "Review your observation"
      : draft
        ? "Your private draft"
        : "Report an observation";
  return (
    <PageScroll contentContainerStyle={styles.body}>
      <ScreenHeader
        eyebrow={isLocal ? "LOCAL / DEMO" : "PRIVATE EVIDENCE"}
        title={stage}
        subtitle={
          success
            ? "Thank you for contributing an observation."
            : "A photo, a pin, and your first-hand observation."
        }
        icon="camera"
        onClose={close}
        closeDisabled={busy}
      />
      {success ? (
        <>
          <Card tone="accent">
            <StatusPill
              label="Submission received"
              icon="check"
              tone="primary"
            />
            <AppText variant="heading">
              {success.response.replay
                ? "Your confirmation was already received"
                : success.publicRoad
                  ? "Public-road observation received"
                  : "Your report stays private"}
            </AppText>
            <AppText>
              {success.response.replay
                ? "Return to the map to check current incident details. This replay did not create another report."
                : success.publicRoad
                  ? "An approximate public-road incident pin was confirmed. Check the incident details for its current verification status; a report is not a safety guarantee."
                  : "This private-property observation stays off the public map and earns no public-usefulness points."}
            </AppText>
            <AppText variant="caption" tone="muted">
              {success.response.replay
                ? "The server returned your existing confirmation; this was not a new submission."
                : "The server accepted your confirmation."}
              {isLocal
                ? " This result belongs only to the LOCAL/DEMO service; no live AWS services were used."
                : ""}
            </AppText>
          </Card>
          <Button title="Return to map" icon="map" onPress={close} />
        </>
      ) : (
        <>
          <Card tone={pinChosen ? "default" : "warning"}>
            <View style={styles.row}>
              <StatusPill
                label={
                  !pinChosen
                    ? "Choose observation pin"
                    : accuracy === null
                      ? "Chosen map pin"
                      : "Foreground location"
                }
                icon="locate"
                tone={pinChosen ? "muted" : "warning"}
              />
            </View>
            <AppText variant="label">
              {pinChosen
                ? "Observation location"
                : "No observation pin selected"}
            </AppText>
            {pinChosen ? (
              <AppText variant="caption" tone="muted">
                {pin.lat.toFixed(5)}, {pin.lon.toFixed(5)}
                {accuracy === null
                  ? ""
                  : ` · accuracy ±${Math.round(accuracy)} m`}
              </AppText>
            ) : null}
            <AppText variant="caption" tone="muted">
              {pinChosen
                ? "Close this sheet and tap the map to correct the pin before confirming."
                : "Return to the map and choose a pin, or use foreground location, before capturing evidence."}
            </AppText>
          </Card>
          {report.isFetching && draft?.reportId ? (
            <LoadingState label="Refreshing private report…" />
          ) : null}
          {report.error ? (
            <StateMessage
              title="Could not refresh your report"
              body={report.error.message}
              tone="danger"
            >
              <Button
                title="Retry report refresh"
                icon="refresh"
                variant="secondary"
                disabled={busy || report.isFetching}
                onPress={() => {
                  void report.refetch();
                }}
              />
            </StateMessage>
          ) : null}
          {error ? (
            <StateMessage
              title="Action needs attention"
              body={error}
              tone="danger"
            />
          ) : null}
          {draftLoading ? (
            <LoadingState label="Opening your saved private draft…" />
          ) : draftLoadFailed ? (
            <StateMessage
              title="Private draft could not be opened"
              body="Your saved evidence has been kept. Retry before capturing another photo, or return to the map."
              tone="warning"
            >
              <Button
                title="Retry opening private draft"
                icon="refresh"
                variant="secondary"
                onPress={() => {
                  setError("");
                  void loadDraft();
                }}
              />
            </StateMessage>
          ) : !draft ? (
            permission?.granted ? (
              <>
                <View
                  style={[
                    styles.media,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.surfaceAlt,
                    },
                  ]}
                >
                  <CameraView
                    ref={camera}
                    style={styles.camera}
                    facing="back"
                  />
                </View>
                <Card>
                  <StatusPill
                    label="Private until you confirm"
                    icon="shield"
                    tone="muted"
                  />
                  <AppText variant="heading">Capture what you can see</AppText>
                  <AppText variant="caption" tone="muted">
                    Keep faces, house numbers and personal details out of the
                    photo. Only capture from a safe place.
                  </AppText>
                  <Button
                    title={busy ? "Saving private image…" : "Capture photo"}
                    icon="camera"
                    disabled={busy}
                    onPress={capture}
                  />
                </Card>
              </>
            ) : (
              <Card tone="accent">
                <StatusPill
                  label="Camera access"
                  icon="camera"
                  tone="primary"
                />
                <AppText variant="heading">
                  Show the issue, keep the evidence private
                </AppText>
                <AppText>
                  JalNet needs camera permission to capture evidence. You can
                  keep browsing the map without it.
                </AppText>
                <Button
                  title={busy ? "Opening camera permission…" : "Allow camera"}
                  icon="camera"
                  disabled={busy}
                  onPress={() => {
                    void act(async () => {
                      await requestPermission();
                    });
                  }}
                />
                <Button
                  title="Open app settings"
                  icon="settings"
                  variant="secondary"
                  disabled={busy}
                  onPress={() => {
                    void act(async () => {
                      await Linking.openSettings();
                    });
                  }}
                />
              </Card>
            )
          ) : (
            <>
              <View
                style={[
                  styles.media,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceAlt,
                  },
                ]}
              >
                <Image
                  source={{ uri: draft.uri }}
                  style={styles.preview}
                  resizeMode="contain"
                  accessibilityLabel="Your private captured evidence"
                />
              </View>
              <View style={styles.row}>
                <StatusPill
                  label="Private draft saved"
                  icon="shield"
                  tone="muted"
                />
              </View>
              <AppText variant="caption" tone="muted">
                Saved on this device. Your original photo is not published on
                the public map.
              </AppText>
              {!report.data ||
              ["DRAFT", "UPLOADING"].includes(report.data.status) ? (
                <Card tone="accent">
                  <AppText variant="heading">Ready for private upload</AppText>
                  <AppText variant="caption" tone="muted">
                    Upload this saved JPEG to continue. If the connection fails,
                    retry with the same draft.
                  </AppText>
                  <Button
                    title={
                      busy
                        ? "Uploading private evidence…"
                        : "Upload private evidence"
                    }
                    icon="upload"
                    disabled={busy}
                    onPress={upload}
                  />
                </Card>
              ) : null}
              {report.data?.status === "ANALYZING" ? (
                <Card>
                  <LoadingState
                    label={
                      isLocal
                        ? "Preparing manual review…"
                        : "Analyzing private evidence…"
                    }
                  />
                  <AppText variant="caption" tone="muted">
                    {isLocal
                      ? "LOCAL/DEMO: no image model runs. You will classify this observation yourself."
                      : "Analysis produces a draft for your review, not a verified water condition."}{" "}
                    If scheduling was interrupted, retry this same report.
                  </AppText>
                  <Button
                    title={
                      isLocal
                        ? "Retry review scheduling"
                        : "Retry analysis scheduling"
                    }
                    icon="refresh"
                    variant="secondary"
                    disabled={busy}
                    onPress={upload}
                  />
                </Card>
              ) : null}
              {report.data &&
              ["ACCEPTED", "MERGED"].includes(report.data.status) ? (
                <Card tone="accent">
                  <StatusPill
                    label="Already submitted"
                    icon="check"
                    tone="primary"
                  />
                  <AppText variant="heading">
                    Your confirmation was received
                  </AppText>
                  <AppText variant="caption" tone="muted">
                    Finish to remove this saved local draft and return to the
                    map. This does not create another report.
                  </AppText>
                  <Button
                    title="Finish / clear submitted draft"
                    icon="check"
                    disabled={busy}
                    onPress={() => {
                      void act(async () => {
                        await clearDraft(draft.accountScope);
                        const file = new File(draft.uri);
                        if (file.exists) file.delete();
                        await queryClient.invalidateQueries();
                        setFinishRequested(true);
                      });
                    }}
                  />
                </Card>
              ) : null}
              {report.data?.status === "NEEDS_CONFIRMATION" ? (
                <>
                  <Card tone="warning">
                    <StatusPill
                      label={
                        isLocal
                          ? "LOCAL / DEMO · Manual review"
                          : "Your review is required"
                      }
                      icon="warning"
                      tone="warning"
                    />
                    <AppText variant="heading">
                      Confirm what you observed
                    </AppText>
                    <AppText>
                      {isLocal
                        ? "No image model ran. Choose the category and severity from your own observation."
                        : report.data.aiAssessment
                          ? `AI draft for your review; not verified: ${report.data.aiAssessment.publicDraft}`
                          : "Analysis unavailable. Classify manually; your report is retained."}
                    </AppText>
                    {report.data.aiAssessment?.uncertaintyReasons.length ? (
                      <AppText variant="caption" tone="muted">
                        {report.data.aiAssessment.uncertaintyReasons.join(" ")}
                      </AppText>
                    ) : null}
                  </Card>
                  <Card>
                    <AppText variant="heading">What kind of issue?</AppText>
                    <View style={styles.choices}>
                      {categories.map((value) => (
                        <View key={value} style={styles.choice}>
                          <Button
                            title={categoryLabels[value]}
                            icon={category === value ? "check" : "droplets"}
                            selected={category === value}
                            variant="secondary"
                            disabled={busy}
                            onPress={() => setCategory(value)}
                          />
                        </View>
                      ))}
                    </View>
                    <AppText variant="label">
                      Severity · {severity} of 4
                    </AppText>
                    <AppText variant="caption" tone="muted">
                      Qualitative observation only, from lower to higher
                      severity. This is not a measured water depth.
                    </AppText>
                    <View style={styles.severities}>
                      {([1, 2, 3, 4] as const).map((n) => (
                        <View key={n} style={styles.severity}>
                          <Button
                            title={String(n)}
                            accessibilityLabel={`Severity ${n} of 4`}
                            selected={severity === n}
                            variant="secondary"
                            disabled={busy}
                            onPress={() => setSeverity(n)}
                          />
                        </View>
                      ))}
                    </View>
                    <FormField
                      label="Observation note"
                      helper="Optional · avoid personal details"
                      accessibilityLabel="Observation note"
                      placeholder="What did you notice?"
                      maxLength={500}
                      value={note}
                      onChangeText={setNote}
                      editable={!busy}
                      multiline
                      style={styles.note}
                    />
                    <AppText variant="caption" tone="muted">
                      {note.length} / 500 characters
                    </AppText>
                  </Card>
                  <Card>
                    <AppText variant="heading">Before you confirm</AppText>
                    <View style={styles.consent}>
                      <View style={styles.flex}>
                        <AppText variant="label">
                          I observed this and it is still active
                        </AppText>
                        <AppText variant="caption" tone="muted">
                          Confirm only a current, first-hand observation.
                        </AppText>
                      </View>
                      <View style={styles.switchTarget}>
                        <Switch
                          accessibilityLabel="I observed this and it is still active"
                          value={active}
                          onValueChange={setActive}
                          style={styles.switchControl}
                          disabled={busy}
                          trackColor={{
                            false: colors.border,
                            true: colors.primary,
                          }}
                          thumbColor={colors.surface}
                        />
                      </View>
                    </View>
                    <View
                      style={[
                        styles.consent,
                        styles.consentBorder,
                        { borderColor: colors.border },
                      ]}
                    >
                      <View style={styles.flex}>
                        <AppText variant="label">
                          Publish an approximate incident pin
                        </AppText>
                        <AppText variant="caption" tone="muted">
                          This is a public-road issue. The original photo
                          remains private.
                        </AppText>
                      </View>
                      <View style={styles.switchTarget}>
                        <Switch
                          accessibilityLabel="Publish approximate public-road incident"
                          value={publicRoad}
                          onValueChange={setPublicRoad}
                          style={styles.switchControl}
                          disabled={busy}
                          trackColor={{
                            false: colors.border,
                            true: colors.primary,
                          }}
                          thumbColor={colors.surface}
                        />
                      </View>
                    </View>
                    <AppText variant="caption" tone="muted">
                      Private-property reports stay off the public map and earn
                      no public-usefulness points.
                    </AppText>
                    <Button
                      title={
                        busy
                          ? "Submitting observation…"
                          : publicRoad
                            ? "Confirm and publish"
                            : "Confirm private report"
                      }
                      icon="check"
                      disabled={busy || !active}
                      onPress={confirm}
                    />
                    {!active ? (
                      <AppText variant="caption" tone="muted">
                        Enable the first-hand, still-active confirmation to
                        submit.
                      </AppText>
                    ) : null}
                  </Card>
                </>
              ) : null}
              <Button
                title="Discard draft"
                icon="trash"
                variant="danger"
                disabled={busy}
                onPress={reset}
              />
            </>
          )}
          <Button
            title={draft ? "Close / keep draft" : "Return to map"}
            icon="back"
            variant="ghost"
            disabled={busy}
            onPress={close}
          />
        </>
      )}
    </PageScroll>
  );
}
const styles = StyleSheet.create({
  body: { gap: 18 },
  media: { borderRadius: 24, borderWidth: 1, overflow: "hidden" },
  camera: { height: 320 },
  preview: { height: 240, width: "100%" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: { flexBasis: "46%", flexGrow: 1, minWidth: 120 },
  severities: { flexDirection: "row", gap: 8 },
  severity: { flex: 1 },
  consent: { flexDirection: "row", alignItems: "center", gap: 12 },
  consentBorder: { borderTopWidth: 1, paddingTop: 16 },
  switchTarget: {
    minWidth: 52,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  switchControl: { width: 52, height: 48, minWidth: 52, minHeight: 48 },
  flex: { flex: 1, gap: 4 },
  note: { minHeight: 96, textAlignVertical: "top" },
});
