import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

const root = fileURLToPath(new URL("..", import.meta.url));
const require = createRequire(join(root, "apps/mobile/package.json"));
const original = require("./app.json").expo;
const configure = require("./app.config.cjs") as () => typeof original;
const nativePlugin = require("./plugins/withStandalonePreview.cjs") as (
  config: Record<string, unknown>,
) => {
  mods: {
    android: Record<
      string,
      (config: Record<string, unknown>) => Promise<{ modResults: unknown }>
    >;
  };
};
afterEach(() => vi.unstubAllEnvs());

function preview() {
  vi.stubEnv("JALNET_BUILD_VARIANT", "preview");
  return configure();
}
async function runMod(
  name: string,
  modResults: unknown,
  modRequest: Record<string, string> = {},
) {
  const config = preview();
  const plugin = nativePlugin(config);
  const action = plugin.mods.android[name];
  if (!action) throw new Error(`Missing tested native mod: ${name}`);
  return (await action({ ...config, modResults, modRequest })).modResults;
}

// The release portion of the pinned Expo SDK57 generated Groovy template.
// Invoke the actual plugin mod: do not substitute a separate test transformer.
const template = `android {
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            // Caution! In production, you need to generate your own keystore file.
            signingConfig signingConfigs.debug
            def enableShrinkResources = findProperty('android.enableShrinkResourcesInReleaseBuilds') ?: 'false'
            shrinkResources enableShrinkResources.toBoolean()
            minifyEnabled enableMinifyInReleaseBuilds
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
}
`;

describe("isolated standalone Android configuration", () => {
  it("returns exactly the original app.json configuration when the variant is absent", () => {
    vi.stubEnv("JALNET_BUILD_VARIANT", undefined);
    expect(configure()).toEqual(original);
    expect(configure()).not.toBe(original);
  });
  it("rejects unknown or empty variants instead of silently choosing a build", () => {
    for (const variant of ["release", "local-demo", "", "aws"]) {
      vi.stubEnv("JALNET_BUILD_VARIANT", variant);
      expect(configure).toThrow("Unknown JALNET_BUILD_VARIANT");
    }
  });
  it("uses a distinct preview identity and keeps only its supported plugins", () => {
    const config = preview();
    expect(config).toMatchObject({
      name: "JalNet Preview",
      version: "0.1.0-preview.1",
      scheme: "jalnet-preview",
      android: {
        package: "org.jalnet.preview",
        versionCode: 2,
        allowBackup: false,
      },
    });
    expect(
      config.plugins.map((entry: string | string[]) =>
        Array.isArray(entry) ? entry[0] : entry,
      ),
    ).toEqual([
      "@maplibre/maplibre-react-native",
      "expo-sqlite",
      "expo-system-ui",
      "expo-navigation-bar",
      "expo-splash-screen",
      "./plugins/withStandalonePreview.cjs",
    ]);
    expect(original.android.package).toBe("org.jalnet.mobile");
    expect(configure()).toEqual(config);
  });
  it("prevents the preview native plugin being applied to the normal package", () => {
    expect(() => nativePlugin(original)).toThrow("requires org.jalnet.preview");
  });
  it("blocks inherited sensitive permissions and enforces no backup/cleartext in the manifest", async () => {
    const manifest = {
      manifest: {
        $: { "xmlns:android": "http://schemas.android.com/apk/res/android" },
        application: [
          {
            $: {
              "android:name": ".MainApplication",
              "android:allowBackup": "true",
            },
          },
        ],
        "uses-permission": [
          { $: { "android:name": "android.permission.CAMERA" } },
          { $: { "android:name": "android.permission.INTERNET" } },
        ],
      },
    };
    const result = (await runMod("manifest", manifest)) as typeof manifest;
    expect(result.manifest.application[0]?.$).toMatchObject({
      "android:allowBackup": "false",
      "android:usesCleartextTraffic": "false",
    });
    const permissions = result.manifest["uses-permission"];
    expect(
      permissions.find(
        (entry) => entry.$["android:name"] === "android.permission.INTERNET",
      )?.$,
    ).toEqual({ "android:name": "android.permission.INTERNET" });
    for (const permission of preview().android.blockedPermissions) {
      const matching = permissions.filter(
        (entry) => entry.$["android:name"] === permission,
      );
      expect(matching).toHaveLength(1);
      expect(matching[0]?.$).toMatchObject({ "tools:node": "remove" });
    }
  });
  it("sets one ARM64 default while retaining unrelated Gradle properties", async () => {
    const properties = [
      { type: "property", key: "hermesEnabled", value: "true" },
      {
        type: "property",
        key: "reactNativeArchitectures",
        value: "x86,arm64-v8a",
      },
      { type: "property", key: "reactNativeArchitectures", value: "x86_64" },
    ];
    expect(await runMod("gradleProperties", properties)).toEqual([
      { type: "property", key: "hermesEnabled", value: "true" },
      { type: "property", key: "reactNativeArchitectures", value: "arm64-v8a" },
    ]);
  });
  it("removes only release debug signing and safely supports repeated prebuild", async () => {
    const result = (await runMod("appBuildGradle", {
      language: "groovy",
      contents: template,
    })) as { contents: string };
    expect(
      result.contents.match(/signingConfig signingConfigs\.debug/g),
    ).toHaveLength(1);
    expect(result.contents).toContain(
      "release {\n            // Caution! In production, you need to generate your own keystore file.\n            signingConfig null",
    );
    expect(
      await runMod("appBuildGradle", {
        language: "groovy",
        contents: result.contents,
      }),
    ).toEqual({ language: "groovy", contents: result.contents });
  });
  it("fails closed for an unexpected release signing template or Gradle language", async () => {
    await expect(
      runMod("appBuildGradle", { language: "kotlin", contents: template }),
    ).rejects.toThrow("Gradle language");
    for (const contents of [
      template.replace("release {", "renamedRelease {"),
      template.replace(
        /signingConfig signingConfigs.debug/g,
        "signingConfig signingConfigs.unreviewed",
      ),
      template.replace(
        "        release {",
        "        release {\n            signingConfig signingConfigs.debug",
      ),
    ])
      await expect(
        runMod("appBuildGradle", { language: "groovy", contents }),
      ).rejects.toThrow("release signing template");
  });
  it("bundles byte-identical public notices into an isolated native assets directory", async () => {
    const scratch = await mkdtemp(join(tmpdir(), "jalnet-preview-notices-"));
    try {
      const androidRoot = join(scratch, "android");
      await runMod(
        "dangerous",
        {},
        {
          projectRoot: join(root, "apps/mobile"),
          platformProjectRoot: androidRoot,
        },
      );
      const assets = join(androidRoot, "app/src/main/assets/jalnet-notices");
      expect(await readFile(join(assets, "JALNET_MIT.txt"), "utf8")).toBe(
        await readFile(join(root, "LICENSE"), "utf8"),
      );
      expect(
        await readFile(join(assets, "LUCIDE_FEATHER_LICENSE.txt"), "utf8"),
      ).toBe(await readFile(join(root, "third-party/lucide/LICENSE"), "utf8"));
      expect(
        await readFile(
          join(assets, "MAPLIBRE_REACT_NATIVE_LICENSE.md"),
          "utf8",
        ),
      ).toBe(
        await readFile(
          join(
            root,
            "apps/mobile/node_modules/@maplibre/maplibre-react-native/LICENSE.md",
          ),
          "utf8",
        ),
      );
      expect(await readdir(assets)).toHaveLength(14);
    } finally {
      await rm(scratch, { recursive: true, force: true });
    }
  });
  it("refuses an incomplete license distribution before copying partial assets", async () => {
    const scratch = await mkdtemp(
      join(tmpdir(), "jalnet-preview-missing-notice-"),
    );
    try {
      await mkdir(join(scratch, "apps/mobile"), { recursive: true });
      await writeFile(join(scratch, "LICENSE"), "synthetic test license");
      await expect(
        runMod(
          "dangerous",
          {},
          {
            projectRoot: join(scratch, "apps/mobile"),
            platformProjectRoot: join(scratch, "android"),
          },
        ),
      ).rejects.toThrow(
        "required public distribution license/notice is missing",
      );
      await expect(readdir(join(scratch, "android"))).rejects.toThrow();
    } finally {
      await rm(scratch, { recursive: true, force: true });
    }
  });
});
