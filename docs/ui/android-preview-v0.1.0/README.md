# Exact signed Android preview evidence

Captured 2026-10-10 on the owned ARM64 Android 17 / API 37.1 emulator at 1080×2400, density 420. These are real, unedited captures of **org.jalnet.preview 0.1.0-preview.1 / versionCode 2**, installed from the final distribution APK built at clean source **952bfde5ae8dfb047f2f95f2d3763f85dd470aca**.

Artifact SHA-256: `5cc463b5b25803c3b3e23352d3dee5313dcf5ae4a987267364704f2367cba9da`. [Build and acceptance record](../../ANDROID_RELEASE.md).

No Metro/API process was running during these captures: owned development processes were temporarily suspended to preserve their state, and all emulator ADB reverse mappings were removed. The separate development application and its private data were retained. Maps use the fixed public Delhi demo viewport, not GPS. Tank and Stress values are synthetic; no private photo, account, credential or personal location is shown. The nine images were visually inspected before copying byte-for-byte into this pack.

| Actual capture | Observation |
|---|---|
| [Light public map](preview-release-map-system-online.png) | System-selected Light, public streets and permanent internet/backend limitation disclosure |
| [Dark public map](preview-release-map-dark-online.png) | Dark street map, controls and MapLibre logo |
| [Simulated tank](preview-release-water-one-day-dark.png) | 600 L / 40% / ~48h, explicit SIMULATED/DEMO provenance |
| [Fictional Stress](preview-release-stress-default-light.png) | 60 / HIGH / 100%, fictional demo and nonforecast disclosure |
| [Native attribution](preview-release-attribution-dark.png) | OpenFreeMap, OpenMapTiles and OpenStreetMap native credit dialog |
| [Actual splash](preview-release-splash.png) | Frame extracted from a short private startup diagnostic, showing the retained JalNet mark; not a final demo recording |
| [Disconnected map](preview-release-map-offline-cold.png) | Cold launch with airplane mode and no Wi-Fi/data; cached tiles are visible, which does not verify offline map support |
| [Disconnected tank](preview-release-water-offline-simulated.png) | One simulated day still computes 600 L / 40% / ~48h with no internet |
| [Preview limits/privacy](preview-release-about-privacy-light.png) | Reports unavailable; Cedar on separate server; map network/privacy limits |

This pack does not establish physical Redmi compatibility, TalkBack acceptance, live AWS, final video/submission or JalNet P0 completion. Historical development screenshot packs remain preserved separately.
