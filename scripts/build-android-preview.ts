import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Generate native code in an ignored, disposable source snapshot. Never run
// prebuild --clean against the developer application or touch installed data.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const version = "0.1.0-preview.1";
const filename = `JalNet-v${version}-arm64-v8a.apk`;
const argv = process.argv.slice(2);
const allowed = new Set([
  "--allow-dirty",
  "--keystore",
  "--keychain-service",
  "--keychain-account",
]);
const values = new Map<string, string>();
let allowDirty = false;
for (let i = 0; i < argv.length; i++) {
  const flag = argv[i];
  if (!flag || !allowed.has(flag))
    throw new Error("Unknown preview build option");
  if (flag === "--allow-dirty") {
    allowDirty = true;
    continue;
  }
  const value = argv[++i];
  if (!value || value.startsWith("--") || values.has(flag))
    throw new Error("Missing or duplicate preview build option");
  values.set(flag, value);
}
if (process.platform !== "darwin")
  throw new Error(
    "This custody workflow requires macOS Keychain; no fallback password storage",
  );
if (process.versions.node !== "24.21.0")
  throw new Error("Use the pinned Node 24.21.0 runtime");
const sdk = process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT;
const java = process.env.JAVA_HOME;
if (!sdk || !java) throw new Error("Set ANDROID_HOME and JAVA_HOME (JDK 17)");
const buildTools = join(sdk, "build-tools", "36.0.0");
const signer = join(buildTools, "apksigner");
const aligner = join(buildTools, "zipalign");
const keystore = resolve(
  values.get("--keystore") ??
    join(
      homedir(),
      "Library/Application Support/JalNet/signing/preview-release.p12",
    ),
);
const service =
  values.get("--keychain-service") ?? "org.jalnet.preview.release-signing";
const account = values.get("--keychain-account") ?? "jalnet-preview";
for (const path of [signer, aligner, keystore, join(java, "bin", "java")])
  if (!existsSync(path))
    throw new Error(
      "Required Android tool or private signing store is missing",
    );
if (realpathSync(keystore).startsWith(`${realpathSync(root)}/`))
  throw new Error("Signing custody must live outside the repository");
if ((statSync(keystore).mode & 0o077) !== 0)
  throw new Error("Signing store must be readable only by its owner");

// No AWS, EXPO_PUBLIC_*, populated .env, API values or signing passwords enter
// prebuild/Gradle. The password is read only for the final signing child process.
const env: NodeJS.ProcessEnv = { NODE_ENV: "production" };
for (const key of [
  "PATH",
  "HOME",
  "TMPDIR",
  "LANG",
  "LC_ALL",
  "JAVA_HOME",
  "ANDROID_HOME",
  "ANDROID_SDK_ROOT",
  "GRADLE_USER_HOME",
])
  if (process.env[key]) env[key] = process.env[key];
env.EXPO_NO_DOTENV = "1";
env.EXPO_NO_TELEMETRY = "1";
env.CI = "1";
env.JALNET_BUILD_VARIANT = "preview";
function run(
  command: string,
  args: string[],
  cwd = root,
  privateOutput = false,
  childEnv = env,
) {
  const result = spawnSync(command, args, {
    cwd,
    env: childEnv,
    encoding: "utf8",
    stdio: privateOutput ? "pipe" : "inherit",
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error || result.status !== 0)
    throw new Error(
      `Preview build step failed: ${command} (no private signing output exposed)`,
    );
  return result.stdout ?? "";
}
const sourceCommit = run("git", ["rev-parse", "HEAD"], root, true).trim();
const dirty =
  run("git", ["status", "--porcelain"], root, true).trim().length > 0;
if (dirty && !allowDirty)
  throw new Error(
    "Commit reviewed source first; --allow-dirty is only for local build testing",
  );
const files = run(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  root,
  true,
)
  .split("\0")
  .filter(
    (path) =>
      path &&
      existsSync(join(root, path)) &&
      (path.startsWith("apps/mobile/") ||
        path.startsWith("packages/") ||
        path.startsWith("third-party/") ||
        [
          "package.json",
          "pnpm-workspace.yaml",
          "pnpm-lock.yaml",
          "tsconfig.json",
          "LICENSE",
        ].includes(path)) &&
      !path
        .split("/")
        .some(
          (part) =>
            part.startsWith(".env") ||
            ["android", "ios", "node_modules", "dist"].includes(part),
        ),
  )
  .sort();
mkdirSync(join(root, ".release"), { recursive: true, mode: 0o700 });
const work = mkdtempSync(join(root, ".release/work-"));
const digest = createHash("sha256");
for (const path of files) {
  const contents = readFileSync(join(root, path));
  digest.update(path).update("\0").update(contents).update("\0");
  mkdirSync(dirname(join(work, path)), { recursive: true });
  copyFileSync(join(root, path), join(work, path));
}
symlinkSync(join(root, "node_modules"), join(work, "node_modules"), "dir");
const mobile = join(work, "apps/mobile");
symlinkSync(
  join(root, "apps/mobile/node_modules"),
  join(mobile, "node_modules"),
  "dir",
);
const pkgPath = join(mobile, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
pkg.main = "preview.ts";
pkg.expo = {
  autolinking: {
    android: {
      exclude: [
        "expo-dev-client",
        "expo-dev-launcher",
        "expo-dev-menu",
        "expo-dev-menu-interface",
        "expo-camera",
        "expo-location",
        "expo-auth-session",
        "expo-secure-store",
        "expo-web-browser",
        "expo-image-manipulator",
        "expo-file-system",
      ],
    },
  },
};
// Expo automatically applies expo-dev-client's plugin when it is a direct
// dependency. Omit it in this isolated manifest, never the normal app manifest.
delete pkg.dependencies["expo-dev-client"];
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
run(
  "pnpm",
  ["exec", "expo", "prebuild", "--platform", "android", "--no-install"],
  mobile,
);
const android = join(mobile, "android");
const gradle = readFileSync(join(android, "app/build.gradle"), "utf8");
if (
  !gradle.includes("signingConfig null") ||
  !gradle.includes("org.jalnet.preview")
)
  throw new Error("Preview package/signing configuration was not applied");
run(
  "./gradlew",
  [
    ":app:assembleRelease",
    "-PreactNativeArchitectures=arm64-v8a",
    "--max-workers=4",
    "--console=plain",
  ],
  android,
);
const unsigned = join(
  android,
  "app/build/outputs/apk/release/app-release-unsigned.apk",
);
if (!existsSync(unsigned))
  throw new Error(
    "Expected unsigned release APK missing; refusing another artifact",
  );
const artifactDir = join(work, "artifacts");
mkdirSync(artifactDir, { mode: 0o700 });
const aligned = join(artifactDir, "aligned-unsigned.apk");
const apk = join(artifactDir, filename);
run(aligner, ["-P", "16", "-f", "4", unsigned, aligned]);
const password = run(
  "/usr/bin/security",
  ["find-generic-password", "-a", account, "-s", service, "-w"],
  root,
  true,
).trim();
if (!password)
  throw new Error(
    "Signing password unavailable in Keychain; no fallback or key generation",
  );
run(
  signer,
  [
    "sign",
    "--ks",
    keystore,
    "--ks-key-alias",
    account,
    "--ks-pass",
    "env:JALNET_SIGNING_PASSWORD",
    "--key-pass",
    "env:JALNET_SIGNING_PASSWORD",
    "--out",
    apk,
    aligned,
  ],
  root,
  true,
  { ...env, JALNET_SIGNING_PASSWORD: password },
);
const signature = run(
  signer,
  ["verify", "--verbose", "--print-certs", apk],
  root,
  true,
);
writeFileSync(join(artifactDir, "signature.txt"), signature);
run(aligner, ["-c", "-P", "16", "4", apk]);
const badging = run(
  join(buildTools, "aapt"),
  ["dump", "badging", apk],
  root,
  true,
);
if (
  !badging.includes("name='org.jalnet.preview'") ||
  !badging.includes("versionCode='2'") ||
  !badging.includes("versionName='0.1.0-preview.1'") ||
  badging.includes("application-debuggable") ||
  !badging.includes("native-code: 'arm64-v8a'")
)
  throw new Error(
    "Actual APK package/version/debuggability/ABI verification failed",
  );
const entries = run("/usr/bin/unzip", ["-Z1", apk], root, true).split("\n");
if (
  !entries.includes("assets/index.android.bundle") ||
  !entries.includes("lib/arm64-v8a/libhermesvm.so") ||
  entries.some(
    (path) => path.startsWith("lib/") && !path.startsWith("lib/arm64-v8a/"),
  )
)
  throw new Error(
    "Actual APK bundled runtime or single-ABI verification failed",
  );
if (
  /uses-permission: name='android\.permission\.(?:CAMERA|ACCESS_FINE_LOCATION|ACCESS_COARSE_LOCATION|RECORD_AUDIO|SYSTEM_ALERT_WINDOW)'/.test(
    badging,
  )
)
  throw new Error("Standalone preview contains a forbidden native permission");
writeFileSync(join(artifactDir, "apk-badging.txt"), badging);
const sha256 = createHash("sha256").update(readFileSync(apk)).digest("hex");
writeFileSync(
  join(artifactDir, `${filename}.sha256`),
  `${sha256}  ${filename}\n`,
);
const metadata = {
  sourceCommit,
  dirty,
  sourceInputsSha256: digest.digest("hex"),
  filename,
  apk,
  bytes: statSync(apk).size,
  sha256,
  version,
  versionCode: 2,
  package: "org.jalnet.preview",
  abi: "arm64-v8a",
  signed: true,
};
writeFileSync(
  join(artifactDir, "build.json"),
  `${JSON.stringify(metadata, null, 2)}\n`,
);
console.log(JSON.stringify(metadata, null, 2));
