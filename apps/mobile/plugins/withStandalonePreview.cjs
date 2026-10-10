const fs = require("node:fs/promises");
const path = require("node:path");
const {
  AndroidConfig,
  withAndroidManifest,
  withAppBuildGradle,
  withDangerousMod,
  withGradleProperties,
} = require("expo/config-plugins");

const blockedPermissions = [
  "CAMERA",
  "ACCESS_COARSE_LOCATION",
  "ACCESS_FINE_LOCATION",
  "ACCESS_BACKGROUND_LOCATION",
  "RECORD_AUDIO",
  "READ_EXTERNAL_STORAGE",
  "WRITE_EXTERNAL_STORAGE",
  "MANAGE_EXTERNAL_STORAGE",
  "READ_MEDIA_IMAGES",
  "READ_MEDIA_VIDEO",
  "READ_MEDIA_AUDIO",
  "READ_MEDIA_VISUAL_USER_SELECTED",
  "ACCESS_MEDIA_LOCATION",
  "SYSTEM_ALERT_WINDOW",
  "FOREGROUND_SERVICE",
  "FOREGROUND_SERVICE_CAMERA",
  "FOREGROUND_SERVICE_LOCATION",
  "FOREGROUND_SERVICE_MICROPHONE",
  "FOREGROUND_SERVICE_DATA_SYNC",
  "FOREGROUND_SERVICE_MEDIA_PLAYBACK",
  "FOREGROUND_SERVICE_MEDIA_PROJECTION",
  "FOREGROUND_SERVICE_CONNECTED_DEVICE",
  "FOREGROUND_SERVICE_HEALTH",
  "FOREGROUND_SERVICE_REMOTE_MESSAGING",
  "FOREGROUND_SERVICE_SPECIAL_USE",
  "FOREGROUND_SERVICE_SYSTEM_EXEMPTED",
].map((permission) => `android.permission.${permission}`);

function releaseWithoutDebugSigning(contents) {
  const blocks = [
    ...contents.matchAll(
      /^([ \t]*)release[ \t]*\{[ \t]*\r?\n([\s\S]*?)^\1\}/gm,
    ),
  ];
  if (blocks.length !== 1)
    throw new Error("Unsupported Expo Android release signing template");
  const block = blocks[0];
  const signing = block[2]
    .split(/\r?\n/)
    .filter((line) => /^\s*signingConfig\b/.test(line));
  if (
    signing.length !== 1 ||
    !/^\s*signingConfig\s+(signingConfigs\.debug|null)\s*$/.test(signing[0])
  )
    throw new Error("Unsupported Expo Android release signing template");
  return contents.replace(
    block[0],
    block[0].replace(
      /signingConfig\s+signingConfigs\.debug/,
      "signingConfig null",
    ),
  );
}

const repositoryNotices = [
  ["LICENSE", "JALNET_MIT.txt"],
  ["apps/mobile/LICENSE", "EXPO_STARTER_MIT.txt"],
  ["third-party/lucide/LICENSE", "LUCIDE_FEATHER_LICENSE.txt"],
  [
    "third-party/openfreemap-styles/LICENSE.md",
    "OPENFREEMAP_STYLES_LICENSE.md",
  ],
  [
    "third-party/openfreemap-styles/OPENMAPTILES_DARK_LICENSE.md",
    "DARK_MATTER_LICENSE.md",
  ],
  [
    "third-party/openfreemap-styles/README.md",
    "OPENFREEMAP_STYLE_ADAPTATION.md",
  ],
];
const dependencyNotices = [
  [
    "@maplibre/maplibre-react-native",
    "LICENSE.md",
    "MAPLIBRE_REACT_NATIVE_LICENSE.md",
  ],
  ["react-native", "LICENSE", "REACT_NATIVE_LICENSE.txt"],
  ["react", "LICENSE", "REACT_LICENSE.txt"],
  ["expo", "LICENSE", "EXPO_LICENSE.txt"],
  ["expo-sqlite", "LICENSE", "EXPO_SQLITE_LICENSE.txt"],
  ["react-native-safe-area-context", "LICENSE", "SAFE_AREA_LICENSE.txt"],
  ["react-native-svg", "LICENSE", "REACT_NATIVE_SVG_LICENSE.txt"],
  ["zod", "LICENSE", "ZOD_LICENSE.txt"],
];

async function copyNotices(projectRoot, androidRoot) {
  const repositoryRoot = path.resolve(projectRoot, "../..");
  const assetsRoot = path.join(
    androidRoot,
    "app/src/main/assets/jalnet-notices",
  );
  // All inputs are fixed, public source/dependency notices. No environment,
  // signing material, user data or private runtime directory is copied.
  const inputs = [
    ...repositoryNotices.map(([source, destination]) => [
      path.join(repositoryRoot, source),
      destination,
    ]),
    ...dependencyNotices.map(([dependency, source, destination]) => [
      path.join(projectRoot, "node_modules", dependency, source),
      destination,
    ]),
  ];
  // Validate every required notice before writing an incomplete distribution.
  for (const [source] of inputs) {
    const info = await fs.stat(source).catch(() => null);
    if (!info?.isFile() || info.size === 0)
      throw new Error(
        "A required public distribution license/notice is missing",
      );
  }
  await fs.mkdir(assetsRoot, { recursive: true });
  for (const [source, destination] of inputs)
    await fs.copyFile(source, path.join(assetsRoot, destination));
}

function withStandalonePreview(config) {
  if (config.android?.package !== "org.jalnet.preview")
    throw new Error("Standalone preview plugin requires org.jalnet.preview");
  config = withAndroidManifest(config, (mod) => {
    const manifest = AndroidConfig.Manifest.ensureToolsAvailable(
      mod.modResults,
    );
    AndroidConfig.Permissions.addBlockedPermissions(
      manifest,
      blockedPermissions,
    );
    const application =
      AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
    application.$["android:allowBackup"] = "false";
    application.$["android:usesCleartextTraffic"] = "false";
    mod.modResults = manifest;
    return mod;
  });
  config = withGradleProperties(config, (mod) => {
    mod.modResults = mod.modResults.filter(
      (property) =>
        property.type !== "property" ||
        property.key !== "reactNativeArchitectures",
    );
    mod.modResults.push({
      type: "property",
      key: "reactNativeArchitectures",
      value: "arm64-v8a",
    });
    return mod;
  });
  config = withAppBuildGradle(config, (mod) => {
    if (mod.modResults.language !== "groovy")
      throw new Error("Unsupported Expo Android Gradle language");
    mod.modResults.contents = releaseWithoutDebugSigning(
      mod.modResults.contents,
    );
    return mod;
  });
  return withDangerousMod(config, [
    "android",
    async (mod) => {
      await copyNotices(
        mod.modRequest.projectRoot,
        mod.modRequest.platformProjectRoot,
      );
      return mod;
    },
  ]);
}

module.exports = withStandalonePreview;
module.exports.blockedPermissions = blockedPermissions;
