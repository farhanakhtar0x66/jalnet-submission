const base = require("./app.json").expo;
const { blockedPermissions } = require("./plugins/withStandalonePreview.cjs");

module.exports = function jalnetConfig() {
  const variant = process.env.JALNET_BUILD_VARIANT;
  const config = structuredClone(base);
  if (variant === undefined) return config;
  if (variant !== "preview")
    throw new Error(
      "Unknown JALNET_BUILD_VARIANT; use preview or leave it unset",
    );

  const retainedPlugins = new Set([
    "@maplibre/maplibre-react-native",
    "expo-sqlite",
    "expo-system-ui",
    "expo-navigation-bar",
    "expo-splash-screen",
  ]);
  return {
    ...config,
    name: "JalNet Preview",
    slug: "jalnet-preview",
    version: "0.1.0-preview.1",
    scheme: "jalnet-preview",
    android: {
      ...config.android,
      package: "org.jalnet.preview",
      versionCode: 2,
      allowBackup: false,
      permissions: ["android.permission.INTERNET"],
      blockedPermissions: [...blockedPermissions],
    },
    plugins: [
      ...config.plugins.filter((plugin) =>
        retainedPlugins.has(Array.isArray(plugin) ? plugin[0] : plugin),
      ),
      "./plugins/withStandalonePreview.cjs",
    ],
  };
};
