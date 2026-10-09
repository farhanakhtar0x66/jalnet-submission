# Owner final actions — Redmi and submission

Prepared 2026-10-09, Asia/Kolkata. Follow these **20 steps in order**, one physical test at a time. Record actual PASS/FAIL, revision, device/build and time in the [physical log](PHYSICAL_ACCEPTANCE.md) and [five-rehearsal log](FIVE_REHEARSALS.md); every unperformed case remains PENDING. Earlier phone evidence does not pass the latest redesigned build.

The sprint produced an **arm64 development APK through an actual successful Gradle build**, 89,150,106 bytes. It needs Metro/USB; it is not a standalone release APK. Use the reviewed revision/artifact identified in [submission status](SUBMISSION_STATUS.md). Live AWS remains **BLOCKED_AWAITING_SSO** and is not needed here. No credentials, AWS deployment or P0-completion claim belongs in this checklist.

## 1. Connect the charged Redmi

Charge it, unlock it and attach a reliable USB data cable. Enable Developer options/USB debugging and accept this computer on the phone. Keep the phone unlocked for permission/installation prompts. Start a terminal in your local **JalNet-Submission** checkout.

Use Node **24.21.0** and pnpm **10.34.6**. The submission checkout has no portable `.tools` directory. On this prepared Mac, if the original sibling JalNet portable tools are needed:

```sh
export PATH="$PWD/../JalNet/.tools/node_modules/.bin:$PATH"
node --version
pnpm --version
```

Otherwise use your installed pinned runtime. Stop on a version mismatch; do not install a different runtime to improvise a take. Apply the same runtime setup in each new terminal. Set `ANDROID_HOME` to your installed Android SDK, then:

```sh
JALNET_ADB="${ANDROID_HOME:?Set ANDROID_HOME to your Android SDK}/platform-tools/adb"
"$JALNET_ADB" version
```

## 2. Check adb authorization

```sh
"$JALNET_ADB" devices -l
```

The Redmi must say `device`, not `unauthorized` or `offline`. Resolve the on-phone prompt/cable first. Privately enter only its actual serial when this command waits; do not put it in public evidence:

```sh
read -r JALNET_DEVICE_SERIAL
"$JALNET_ADB" -s "$JALNET_DEVICE_SERIAL" get-state
```

Use this serial-specific form for every command below, even when an emulator is also connected.

## 3. Install the compatible APK in place

Use the locally built, reviewed artifact; a fresh clone will not contain generated Android build files. If it is absent, obtain the tested handoff APK rather than substituting an unknown build.

```sh
"$JALNET_ADB" -s "$JALNET_DEVICE_SERIAL" install -r apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

Approve an ordinary installation prompt on the phone. `-r` preserves app data. **Stop on signature/version/OEM protection errors** and retain the exact sanitized message; do not uninstall, clear storage, downgrade or disable protection. Keep wanted drafts, tank values, routes and appearance.

## 4. Configure USB forwarding

```sh
"$JALNET_ADB" -s "$JALNET_DEVICE_SERIAL" reverse tcp:8787 tcp:8787
"$JALNET_ADB" -s "$JALNET_DEVICE_SERIAL" reverse tcp:8081 tcp:8081
"$JALNET_ADB" -s "$JALNET_DEVICE_SERIAL" reverse --list
```

Repeat after USB reconnect/reboot. This checklist uses API **8787** and Metro **8081**, not the separate ports used by agent emulator verification.

## 5. Start the local API and Metro safely

First identify listeners:

```sh
lsof -nP -iTCP:8787 -sTCP:LISTEN
lsof -nP -iTCP:8081 -sTCP:LISTEN
```

Do not kill an unrelated process. Stop only your known JalNet server with Ctrl-C. **Before switching servers, preserve/finish any wanted server-backed draft on its original server.** A retained phone draft may refer to that server's report; a new fixture cannot fulfill its reference. If you cannot safely resolve that dependency, stop fresh-demo preparation and resume the existing setup.

For a fresh, disposable take, open an API terminal in the checkout:

```sh
pnpm demo:serve --android-usb
```

It seeds one LOCAL/DEMO corridor in a new private temporary directory, with no previous incidents and zero droplets, and initializes mandatory Cedar. It leaves `.local-data`, earlier server evidence and phone storage untouched. Retain the printed **private state directory and exact resume command** locally; do not film/publish that path. Port conflict is a stop, not permission to kill another listener.

In a second checkout terminal:

```sh
pnpm mobile:start:usb
```

For interruption/offline recovery, restart **the same take** using the exact printed `--resume` command, not a fresh `demo:serve`. Paste the exact printed private directory when `read` waits; the standard-port resume command is:

```sh
read -r JALNET_DEMO_DIR
pnpm demo:serve --android-usb --port 8787 --resume "$JALNET_DEMO_DIR"
```

The resume directory must carry the script's marker. To return to the original `.local-data` setup, stop the isolated API and use `pnpm local:server:usb`. Never switch while an in-flight/wanted draft depends on the current server. Do not use `demo:reset`, `pm clear`, uninstall or file deletion for this handoff.

## 6. Verify the latest redesign is running

```sh
"$JALNET_ADB" -s "$JALNET_DEVICE_SERIAL" shell am start -a android.intent.action.VIEW -d 'jalnet://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081' org.jalnet.mobile
```

Confirm Metro is serving this reviewed submission checkout. On the phone, verify the **LOCAL / DEMO** pill, street map, Lucide controls, My Water, Water Stress and System/Light/Dark selector. If you see only the Expo launcher, verify both forwards/listeners and reopen the link; that launcher is not the app.

For a fresh take, once capture/upload is idle and no wanted server-backed draft is unresolved, cold-relaunch to discard only in-memory query state:

```sh
"$JALNET_ADB" -s "$JALNET_DEVICE_SERIAL" shell am force-stop org.jalnet.mobile
"$JALNET_ADB" -s "$JALNET_DEVICE_SERIAL" shell am start -a android.intent.action.VIEW -d 'jalnet://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081' org.jalnet.mobile
```

This preserves app storage/private drafts; never restart during an upload. Then open Routes and use **Refresh route reports**, then check Profile. Require one seeded corridor, no current incident and **0 droplets** from the fresh server. Old client cache can appear until refreshed; do not clear storage or claim a clean result while old values remain.

## 7. Check camera permission and recovery

With no busy operation or wanted draft at risk, use Android's JalNet permissions screen to deny Camera. Open Camera: expect clear permission guidance and a usable close/map path, with no capture/upload. Use **Allow camera** or **Open app settings**, grant permission on the phone and reopen: expect a live preview. An already granted permission may produce no prompt; record the actual outcome, not an assumed denial/recovery pass.

## 8. Check foreground location cases

Use the location control and its **Use foreground location?** explanation. Test denial, approximate permission and precise foreground permission one at a time through Android settings/prompts. Denial must leave map-pin selection usable; granted cases must show an actual fix/accuracy or a bounded, understandable failure. Verify no background-location request. Keep precise coordinates out of screenshots/logs. Before recording, return to the disclosed synthetic demo pin rather than the real fix.

## 9. Capture a safe staged scene

Tap the synthetic demo area near **28.6139, 77.209**, intersecting the seeded corridor from longitude 77.205 to 77.215. These are fixture coordinates, not a claim of a real incident. Aim at a harmless staged water scene/prop with no faces, addresses or private text. Capture one fresh JPEG, inspect the private preview and close/reopen to verify draft recovery before uploading. Preserve any wanted earlier draft; do not discard it to create a new scene.

## 10. Verify the citizen outcome

Upload private evidence, read **LOCAL/DEMO manual review / no image model**, choose **Waterlogging**, severity **2**, and note **“LOCAL/DEMO staged camera test; synthetic pin”**. Deliberately enable the still-active/public-road **demo** inputs and confirm once.

Verify this same report produces one **UNVERIFIED** incident, a fresh warning on the seeded straight-line corridor and exactly **+2 provisional droplets** with a matching ledger entry. Use **Refresh route reports** if needed; record failures honestly. It does not establish a real hazard, road-navigation result, independent corroboration or environmental impact. Successful submission clears its own draft; do not show another take's incident as this capture's result.

## 11. Check theme persistence

Use **System → Light → Dark → System**. Inspect map/sheets/icons/text and confirm the selected pin, viewport, routes, account/session and edited tank values survive appearance changes. For a disposable saved draft, verify appearance switching preserves it too. Wait for saves, close the app from Recents and reopen with the launch link; confirm the chosen appearance and saved tank values restore. Never force a restart during a wanted upload or erase storage to test persistence.

## 12. Check My Water

Open **Reset My Water demo fixture → Reset tank only**. Require capacity **1,500 L**, SIMULATED level **60%**, DEMO FIXTURE consumption **300 L/day**, **900 L / ~72h**, day 0 and Saved on this device. Simulate one day: **600 L / 40% / ~48h**, day 1. Close/reopen and cold restart to verify persistence.

Also check zero consumption gives no depletion estimate; empty tank gives 0 L/0h; invalid/out-of-range inputs show errors. Ensure keyboard controls remain reachable in both appearances. Reset restores only tank data: verify reports/routes/drafts/ledger remain present. Restore the standard tank fixture for each timed take. These are calculated assumptions, not sensors.

## 13. Inspect Water Stress and previews

Restore the six DEMO inputs: require **60/HIGH, 100% coverage**, visible factors/weights and **DEMO INDICATOR**. Clear supply and groundwater: require **55% coverage and no headline score**. Restore afterward. Stress inputs are fictional and screen-local, not an official feed. Verify TankerOS remains noninteractive DEMO supplier/price cards and HeatSafe visibly PLANNED; no booking/payment/contact or live heat claim.

## 14. Test offline recovery

Keep Metro running. Stop only the known current API with Ctrl-C; attempt route refresh and a disposable saved-draft upload. Expect a bounded error/stale-data disclosure, no false success and the draft retained. Restart **that same retained API directory** with its printed `--resume` command, then retry the same draft/route refresh and verify recovery without duplicate awards. Never start a fresh server for a draft's recovery.

Phone Wi-Fi/cellular loss tests public basemap assets separately: USB API forwarding may still work. Record missing/cached-map behavior honestly; no offline-map guarantee. Restore connectivity and check usable controls/assets. Re-establish forwarding after a cable interruption.

## 15. Check attribution and accessibility

Open the native attribution control and read **OpenFreeMap · © OpenMapTiles · Data from OpenStreetMap**. Keep it reachable; include additional Dark style/design credits from the [final script](FINAL_DEMO_SCRIPT.md) in footage/description.

In Android settings enlarge text, then inspect Home, report review, Routes, Profile, My Water and Stress for clipping/scroll/keyboard reachability in both themes. Check Android Back, insets, contrast and touch targets. With TalkBack, check icon labels/focus order/actions; an emulator view is not a physical screen-reader pass. Restore your preferred text/screen-reader settings afterward. Record the actual case results.

## 16. Complete five timed physical rehearsals

Use the [five-rehearsal checklist](FIVE_REHEARSALS.md). Before each new take, finish only disposable test drafts, stop the isolated API, then run a **fresh** `pnpm demo:serve --android-usb`. Earlier state/evidence stays retained; do not delete it. Never switch with a wanted pending draft.

Use the idle, data-preserving cold-relaunch from step 6 for each new take, then refresh and actually check one corridor/no incidents/0 droplets, tank 900 L/~72h and Stress 60/HIGH/100%. Rehearse the phone journey through one +2 outcome plus calculators/Cedar explanation. Record all five individual durations/failures/retries; HTTP smoke or repeated video playback does not pass this gate. If a take fails, diagnose/retry without manufacturing success.

## 17. Record and review the final video

Review the stabilization PR and its final same-SHA CI. Approve a merge only if satisfied, then freeze the exact accepted revision/APK/Metro setup used for footage. Main has intentionally not been merged by the engineering agent. If a physical test requires a code fix, rerun its checks and repeat affected acceptance before freezing.

Follow the [planned 2:43 script](FINAL_DEMO_SCRIPT.md), targeting **2:40–2:45**, strictly below 3:00. Prepare sanitized real Cedar proof with:

```sh
pnpm cedar:demo
```

Show the real production policy, owner allow, foreign deny, **TEST-ONLY** owner forbid and zero denied effects; never change the production policy. Label prepared proof with its actual revision/time. Film the same staged capture→confirmation→incident→warning→ledger result, readable LOCAL/DEMO captions and attribution. Keep credentials, private paths, notifications and real location out of footage. Watch the whole export and measure duration. Final footage is not considered recorded until this actually happens.

## 18. Upload to YouTube and verify access

The owner uploads the reviewed final video **public or unlisted**, then tests the exact URL signed out/incognito, including audio/readability and duration below 3:00. Do not substitute an internal emulator preview for physical-phone proof. Add the actual link to the package/README; no fabricated placeholder URL. The engineering agent has not uploaded it.

## 19. Paste the prepared submission text

Use [FINAL_SUBMISSION_PACKAGE.md](FINAL_SUBMISSION_PACKAGE.md), including genuine contributions, AI assistance and notices. Review the real logged-in form's fields and paste the relevant prepared sections. Each member checks their own required registration/check-in and AWS Builder Center student-profile status. Do not paste credentials; an open verification case and cloud SSO are separate from this local demo. Keep the repository public and verify signed-out access.

## 20. Submit through the official portal and verify receipt

Use the official [event page](https://www.wemakedevs.org/aws/env) and its own submission form; no direct final-form URL was available in the public/static page. Submit **one entry for the team** before **Sunday, October 11, 2026, 8:00 PM IST**, after verifying the real repo/video links and form entries. Preserve the actual confirmation/receipt and submission time privately. A prepared form is not a successful submission.

The deadline was checked against the [organizer's October 6 announcement](https://www.wemakedevs.org/blogs/what-is-happening-in-delhi-on-10-october); YouTube/public-repository/one-team-entry requirements come from the [official rules](https://www.wemakedevs.org/aws/env/rules), checked 2026-10-09 IST. Organizer eligibility approval is already settled; this checklist does not reopen it. **Do not merge the engineering branch into main without owner approval.** Live AWS remains unverified, and P0 remains incomplete.
