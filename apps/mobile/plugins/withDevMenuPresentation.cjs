const { AndroidConfig, withAndroidManifest } = require("expo/config-plugins");

// Expo SDK 57 reads these application metadata values as debug-menu defaults.
// Keep shake, three-finger and key-command access; omit only the floating Tools
// button and launch tutorial that obscure JalNet's own controls in a dev build.
module.exports = function withDevMenuPresentation(config) {
  return withAndroidManifest(config, (configWithManifest) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(
      configWithManifest.modResults,
    );
    for (const [name, value] of [
      ["EXDevMenuShowFloatingActionButton", "false"],
      ["EXDevMenuShowsAtLaunch", "false"],
      ["EXDevMenuIsOnboardingFinished", "true"],
    ]) {
      AndroidConfig.Manifest.addMetaDataItemToMainApplication(
        application,
        name,
        value,
      );
    }
    return configWithManifest;
  });
};
