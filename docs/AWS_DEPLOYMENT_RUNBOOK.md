```sh
aws sts get-caller-identity --profile jalnet
```

Run that first command only after the real local SSO profile is available. Inspect its output privately. **Stop immediately** unless both account and assumed role match the hackathon account/role approved by the team. Do not proceed on an unknown account, default profile, root/user credentials, an expired session, or a failed command. No live command in this runbook has been executed. Current status: **BLOCKED_AWAITING_SSO**.

## 1. Private inputs and hard stop

Use the pinned Node/pnpm from the README. AWS CLI v2 must support the documented Location V2 and key restriction operations. Do not upgrade app dependencies during cutover. Set `JALNET_CUTOVER_CONFIG` to an **absolute path** to a real JSON file inside ignored `.cutover/`; directory mode 700, file mode 600. Edit it locally, never in chat/GitHub. No deployable example with made-up IDs is supplied.

`scripts/aws-safety.ts` defines the strict schema (unknown fields rejected):

| Field | Real value source |
|---|---|
| expectedAccountId | Team-approved 12-digit hackathon account ID, supplied privately before comparing STS |
| expectedRoleArn | Exact approved IAM role ARN, including the SSO role path; STS must be that role's assumed session in the expected account |
| region | User-approved `ap-south-1` |
| stackName | `JalNetDev`, dedicated P0 development stack, never a production stack |
| bedrockModelId | Actual image-capable Nova foundation model ID or inference profile ID/ARN available to this account; no default model |
| bedrockInvokeArns | Actual approved profile + backing-model ARNs, no `*`; profile accounts must match; approve each destination region/processing geography explicitly |
| bootstrapExecutionPolicyArn (optional) | Team-approved account-owned policy for CloudFormation execution, required only for new bootstrap; no implicit AdministratorAccess |
| mapKeyName | Actual dedicated key name chosen by team; no existing production key reuse |
| androidCertificateSha1 | Actual SHA-1 fingerprint of the certificate signing the Android build being tested; obtain from `./gradlew signingReport` in generated Android project |

```sh
umask 077
mkdir -p .cutover
chmod 700 .cutover
chmod 600 "$JALNET_CUTOVER_CONFIG"
```

Complete the read-only model discovery below under the initial manual STS account/role gate before filling the strict model fields and running the guard. The guard rejects credential environment variables, endpoint overrides, conflicting profiles/regions/accounts, missing SSO configuration, and a mismatched STS account/role. It prints no account IDs or credentials. Every later guarded command repeats this check. Do not add static credentials, default credential guesses, `--no-sign-request` to IAM operations, `--no-verify-ssl`, or a different profile. Do not enable debug logging.

## 2. Model and bootstrap prerequisites

After the identity gate, inspect the real model catalog privately:

```sh
aws bedrock list-foundation-models --by-provider Amazon --profile jalnet --region ap-south-1 --output json > .cutover/model-catalog.json
aws bedrock list-inference-profiles --profile jalnet --region ap-south-1 --output json > .cutover/inference-profiles.json
```

Select a Nova image-capable model/profile, check its input modalities, availability and approved geographic routing, and populate the private config. For a foundation model, run `aws bedrock get-foundation-model-availability --model-id "$JALNET_FOUNDATION_MODEL_ID" --profile jalnet --region ap-south-1 > .cutover/model-availability.json`, with that variable set to the actual selected foundation model ID. For an inference profile, run `aws bedrock get-inference-profile --inference-profile-identifier "$JALNET_INFERENCE_PROFILE_ID" --profile jalnet --region ap-south-1 > .cutover/inference-profile.json` and inspect every backing model ARN. Metadata is not proof of image invocation; the bounded direct image probe later must succeed. Stop if a needed resource/access/region is unavailable. Do not insert an empty model to get deployment past validation.

Once the actual config is complete, repeat the identity gate through the strict wrapper:

```sh
pnpm aws:cutover --live --profile jalnet --config "$JALNET_CUTOVER_CONFIG" --action check
```

```sh
aws cloudformation describe-stacks --stack-name CDKToolkit --profile jalnet --region ap-south-1 > .cutover/bootstrap-stack.json
```

If the toolkit exists, review its version, roles, execution policy and permissions boundary privately; reuse the approved compatible toolkit. An AccessDenied/network error is not proof it is absent. Only if AWS specifically confirms absence and the team approves the real execution policy, run:

```sh
pnpm aws:cutover --live --profile jalnet --config "$JALNET_CUTOVER_CONFIG" --action bootstrap
```

The wrapper targets the exact account/region and passes the approved `--cloudformation-execution-policies` ARN. No trust of other accounts, no default AdministratorAccess policy. [CDK bootstrap options](https://docs.aws.amazon.com/cdk/v2/guide/ref-cli-cmd-bootstrap.html) explain why that execution policy must be explicit. Bootstrap creates resources and IAM roles; inspect its plan/permissions with the team before execution. No destroy/uninstall/cleanup commands are included.

## 3. Synth, review diff, deploy, capture outputs

```sh
pnpm synth
pnpm aws:cutover --live --profile jalnet --config "$JALNET_CUTOVER_CONFIG" --action synth
pnpm aws:cutover --live --profile jalnet --config "$JALNET_CUTOVER_CONFIG" --action diff
```

The first synth is credential-free. The guarded synth binds the approved account and region. Read `.cutover/diff.log` privately. Review exact model/profile permission parameters, bucket security/lifecycle, retained tables, Cognito code flow/redirects, JWT issuer/audience, queue/DLQ/source, Lambda limits and provider ARNs. **Stop for any delete, replacement of existing data/identity resources, unexpected account/region/resource, wildcard Bedrock ARN, or broadening outside the reviewed P0 stack.** A missing existing stack is a first deployment, not an excuse to deploy into a production account.

```sh
pnpm deploy --live --profile jalnet --config "$JALNET_CUTOVER_CONFIG"
pnpm aws:cutover --live --profile jalnet --config "$JALNET_CUTOVER_CONFIG" --action outputs
```

Deployment preserves CDK's interactive approval for IAM broadening. Approve only the concrete reviewed P0 changes. Do not use an approval bypass flag. The outputs command requires a healthy stack tagged `Project=JalNet`, `Environment=p0-dev`, matching model parameters, expected API endpoint and queue ownership. Actual outputs go to `.cutover/outputs.json` mode 600. No fabricated resource names or ARNs are committed. Lambda receives table/bucket/queue/model/Cognito values from CDK; AWS supplies its reserved `AWS_REGION`. The SDK uses scoped Lambda roles, never app-bundled AWS credentials.

## 4. Create and restrict the Maps V2 key, then configure mobile

Maps and Routes use the regional **V2 provider/default** resources from outputs. There is no V1 named map or route calculator to invent. The backend routes IAM resource has an empty account component by AWS design. The public Android key must authorize **only Maps**, exactly the Maps provider ARN, the actual Android package/signing fingerprint, and a short explicit expiry (no more than seven days). It must not authorize Routes/Places or resource administration. API key rendering permissions differ from Lambda IAM: AWS documents `geo-maps:*` for the rendering group, including style/sprite/glyph assets. [AWS API key guide](https://docs.aws.amazon.com/location/latest/developerguide/using-apikeys.html), [CreateKey restriction syntax](https://docs.aws.amazon.com/cli/latest/reference/location/create-key.html).

Prepare `.cutover/map-key-input.json` mode 600 by filling the actual config/output values locally: `KeyName`, `ExpireTime` (actual UTC expiry), `Restrictions.AllowActions=["geo-maps:*"]`, `AllowResources=[LocationMapsResourceArn]`, `AllowAndroidApps=[{Package:"org.jalnet.mobile",CertificateFingerprint:actual SHA1}]`, and tags `Project=JalNet`, `Environment=p0-dev`. No key material belongs in this input. Confirm the key name is unused before creation; never overwrite/rotate an existing production key to make the demo work.

```sh
pnpm aws:cutover --live --profile jalnet --config "$JALNET_CUTOVER_CONFIG" --action check
aws location create-key --cli-input-json file://.cutover/map-key-input.json --profile jalnet --region ap-south-1 > .cutover/map-key-response.json
pnpm aws:mobile-config --live --profile jalnet --config "$JALNET_CUTOVER_CONFIG"
```

The response contains an extractable restricted public key: keep it out of logs, Git, screenshots and recordings. The configuration helper repeats identity/stack checks, validates finite unexpired key expiry and exactly the one approved Android caller (no additional web/Apple callers), and writes only public mobile values to ignored `apps/mobile/.env`: AWS mode, actual API/region/pool/client/domain, key/resource ARN and actual signing fingerprint. It never writes AWS access keys, client secrets or server table names. All missing/invalid live values fail to an explicit configuration-blocked screen without AWS API calls or local-provider fallback. In particular a copied localhost API URL is rejected in AWS mode. Restart Metro/build after changing Expo environment.

**Native restriction compatibility remains a live blocker.** The pinned MapLibre exposes a request-transform API, but AWS's consulted key reference does not specify the header protocol needed to enforce Android restrictions. Confirm that protocol from current AWS guidance/support and implement matching scoped request transforms if needed; do not invent headers or weaken/remove app restrictions to claim a pass. Verify an allowed signed build renders style, tile, sprite and glyph assets, a mismatched build/request is denied, attribution is visible, and the same key cannot call Routes/Places. CLI SigV4 map access alone is not proof of this public key/native gate.

## 5. Independent dependency probes before a workflow

```sh
pnpm smoke:aws --live --profile jalnet --config "$JALNET_CUTOVER_CONFIG" --stage dependencies
```

This checks each table/index, private regional bucket encryption/public-access block, Cognito public client/redirects, API JWT issuer/audience and protected routes, health, SQS/DLQ encryption/visibility/redrive/source, worker limits/concurrency, key metadata and an IAM-authenticated Maps style descriptor independently. The bounded descriptor is retained privately under `.cutover/maps-*/style.json`. Failures are named and redacted; no AWS test writes occur until all probes pass. Health means responding, not dependent services proved.

To verify actual Maps service availability separately, use the IAM-authenticated CLI (not the public key) after the identity gate:

```sh
aws geo-maps get-style-descriptor --style Monochrome --color-scheme Light --profile jalnet --region ap-south-1 .cutover/map-style.json > .cutover/map-style-metadata.json
```

This optional standalone command duplicates the dependency script's service probe. Inspect style structure and regional asset URLs privately. This needs the operator's actual Maps permissions; it does not prove key/native rendering. The [AWS Maps CLI reference](https://docs.aws.amazon.com/cli/latest/reference/geo-maps/get-style-descriptor.html) specifies the required output file and SigV4 option. Do not expand Lambda roles to make operator smoke commands pass.

Set `JALNET_SMOKE_MANIFEST` to an absolute mode-600 JSON file with actual values per `smokeManifestSchema` in `scripts/smoke-aws.ts`: UUID `runId`, absolute approved `captureDirectory`, one/two fresh captured `.jpg` paths/SHA256/capturedAt/actual location, and actual road route origin/destination. Use native resized EXIF-stripped captures, ≤3.75 MB and ≤4 MP. No synthetic fixture or invented observed pin. Hashes and paths are private execution inputs. The manifest is deliberately not seeded with deployable fake data.

```sh
pnpm smoke:aws --live --profile jalnet --config "$JALNET_CUTOVER_CONFIG" --stage providers --manifest "$JALNET_SMOKE_MANIFEST"
```

This directly invokes Nova and Location Routes independently, then proves DynamoDB private report write/read and S3 presigned PUT/read hash. It creates at most one private report and one ≤3.75 MB object, no public event, reward, queue job or AWS infrastructure. The report intentionally remains UPLOADING; raw evidence expires under the actual 14-day bucket lifecycle. No deletion/cleanup occurs. A model fallback cannot disguise a failed direct invocation. Capture `.cutover/smoke-RUNID.json` privately; STARTED means inspect partial effects before deciding a new run, never automatic replay.

## 6. Cognito and full deployed workflow

Use native Cognito PKCE to sign into **two dedicated, distinct demo accounts**. Each starts with zero droplets, empty ledger and no saved routes. Confirm callbacks and sign-out/account separation, no client secret, and gateway rejection of expired, absent, wrong-client and unsigned JWT-shaped tokens. Obtain short-lived access tokens locally through the authorized login flow into two separate private mode-600 JSON files `{accessToken: actual token}`; do not paste tokens, put them in CLI args, shell history, screen recordings or Git. The app currently requires sign-in again after expiry; automatic refresh is not claimed.

For a new runId manifest, provide two different actual current JPEG observations of the same real public-road issue, two private `tokenFiles`, explicit actual `observations` (category, qualitative severity 1–4, actual pin, stillActive/publicRoad=true), and a real intersecting road corridor. If no actual safe observations exist, do not publish fabricated ones: mark this live flow gate BLOCKED and keep the labeled local rehearsal separate.

```sh
pnpm smoke:aws --live --profile jalnet --config "$JALNET_CUTOVER_CONFIG" --stage workflow --manifest "$JALNET_SMOKE_MANIFEST"
```

The workflow reruns dependency/direct model/route probes, then checks deployed bearer rejection and two distinct subjects from authenticated `/v1/me` responses, empty accounts, one persisted road route, two owned drafts, cross-owner denial, signed uploads, actual SQS/worker assessment, explicit confirmations/replays, one ACTIVE fused public incident, privacy fields, actual route intersection/warning, and exact eventual 10/7 ledger balances. Two different tokens for the same subject fail before application writes. A manual fallback fails the live model gate. A route that does not intersect fails; never move a real observation or replace a road route with a line to manufacture success. Tables/queue APIs in the operator profile prove operator access only; this HTTP workflow exercises scoped Lambda permissions.

The script never deletes cloud data, receives/purges queue messages, creates infrastructure, changes IAM, signs up users, or auto-retries a write run. One invocation is capped at two new reports/objects, one saved route, two confirmations plus two replays, 30 report polls per report, 10 ledger polls, ≤2 attempts per direct model invocation, bounded SDK retries and a ten-minute process deadline. Queue processing is separately capped by three receives, concurrency two, 60-second Lambda timeout, 90-second lease and two model attempts. Worker retries can continue after the CLI deadline, within those deployed bounds. Inspect DLQ/queue counts read-only; never purge/delete to hide a failure. Daily application draft/upload/route quotas remain enabled. Repeated manual invocations still incur costs; stop after failure and review private receipts/budget with the team.

## 7. Release/demo gate and failure handling

Record each boundary in [AWS_CUTOVER_CHECKLIST.md](AWS_CUTOVER_CHECKLIST.md) with sanitized actual evidence, commit and timestamp. A successful dependency command does not verify the full workflow, native key restrictions, physical camera/GPS, eventual behavior under failures or P0 completion. No script changes a document status to VERIFIED.

If SSO/account/model/permission/key/route/API fails: stop dependent live work immediately; keep the exact error privately, record a sanitized blocker and preserve private drafts. Keep `.cutover/`, actual `apps/mobile/.env` and `.local-data` intact for review/retry. Never substitute a fixture silently or broaden a wildcard permission. No cloud reset/delete command is authorized here. No final **live AWS** recording until actual AWS and physical acceptance gates pass. The separate [local Build It gate](BUILD_IT_DEVICE_DEMO.md) does not wait for SSO and cannot establish cloud success.

To deliberately return a USB development phone to the local demonstration, stop only the known AWS-mode Metro you started. If a local API is already running, ensure its upload transport matches the phone; stop/restart only that process if needed. Do not reset local state containing wanted drafts. Repeat the phone's adb reverse for 8787 and 8081, then in separate terminals:

```sh
pnpm local:server:usb
pnpm mobile:start:usb
```

For an emulator use `pnpm local:server` / `pnpm mobile:start:local`. The shell presets explicitly override provider mode/API; private cloud environment files remain unchanged. Refresh the development client and verify the visible **LOCAL/DEMO** disclosure before proceeding. Existing app draft/cache scoping preserves cloud identities separately; local identity and fixtures never become AWS tokens/data. This is an intentional rehearsal switch, not an automatic runtime fallback or cloud deployment rollback.
