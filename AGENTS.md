# AGENTS.md

## Guide index

| Area | Path | Guide |
|------|------|-------|
| Angular web app (this file) | `src/` | § below |
| Kubernetes Helm chart | `helm/` | [`helm/AGENTS.md`](helm/AGENTS.md) |
| Android (Capacitor) native project | `android/` | [`android/AGENTS.md`](android/AGENTS.md) |

## Repository Overview

Angular web (+ Android) front-end for the MOSIP Compliance Toolkit (CTK) — lets partners test biometric products against MOSIP specs and lets admins review results. Backend: [mosip-compliance-toolkit](https://github.com/mosip/mosip-compliance-toolkit). Product overview: [docs.mosip.io/compliance-tool-kit](https://docs.mosip.io/compliance-tool-kit).

Three project types (mirrors the backend): **SBI** (biometric capture, web-local or Android on-device intent), **SDK** (matching/quality, via `biosdk-service` REST), **ABIS** (async over ActiveMQ). The UI only orchestrates test execution (pull test cases, drive the product, send responses back, render results) — it does **not** implement compliance rules; verdicts always come from the backend.

## Technology Stack

- **Angular 13.3** (TS ~4.6), **Angular Material 13**, **Angular CLI ~13.3.2** for local/web. Android CI (`android.yml`) intentionally uses CLI `13.0.0` instead — see `android/AGENTS.md`.
- **@ngx-translate** (en/ar/fr, RTL-aware) · **Keycloak** auth (cookie/JWT web, `android-keycloak` handler for Android)
- **`@stomp/rx-stomp` + `stompjs`** for ActiveMQ (ABIS) · **Capacitor 4** packages the same codebase as the Android app in `android/`
- **Karma + Jasmine** unit tests · production build served by **nginx** (`Dockerfile`, `nginx.conf`, `default.conf`)
- **Node 14.17.3 / npm 6.14.13** recommended (README)

## Build & Test Commands

From repo root:

```shell
npm install
npm start                                                    # dev server, localhost:4200
ng serve --proxy-config proxy.conf.json                      # dev server via proxy (avoids CORS)
ng build "--prod" "--base-href" "." "--output-path=dist"     # production build
npm test                                                      # Karma + Jasmine unit tests only — no e2e suite
npm run sonar                                                 # requires sonar-scanner + SONAR_TOKEN
```

```shell
docker build -t toolkitui .
docker run -d -p 8080:8080 --name toolkitui toolkitui   # http://localhost:8080
```

## Configuration

All environment-specific, all overridden per deployment:

- `src/assets/config.json` (tracked) — runtime config via `APP_INITIALIZER`/`AppConfigService`: `SERVICES_BASE_URL`, `SBI_BASE_URL`, `SDK_BASE_URL`, `toolkitUiUrl`, login/logout paths. Local points at the `ng serve` proxy; prod is replaced. Backend `configs` endpoint layers session-timeout/admin-role/RTL-language config on top at runtime.
- `proxy.conf.json` — Angular dev-server proxy, not committed by default; create per README.
- `.env` — Android build vars (`NX_APP_SERVICES_BASE_URL`, `NX_APP_IAM_URL`, `NX_APP_IAM_REALM`, `NX_APP_IAM_CLIENT_ID`). **Not in `.gitignore`** — never `git add` it; CI sets these as Action env vars instead.
- `src/environments/environment*.ts` — build-time; `environment.isAndroidAppMode` switches web vs. Android behavior (e.g. Android reads `SERVICES_BASE_URL` from `environment.android.ts`, not `config.json`).

Check `git diff` before committing near `config.json`/`.env`/`environment.*.ts` — none should carry real secrets.

## Project Structure Notes

```text
src/
├── main.ts, index.html, styles.css   # bootstrap + global styles
├── environments/                     # environment.ts | .prod.ts | .android.ts
├── assets/
│   ├── config.json                   # runtime config
│   └── i18n/                         # eng | ara | fra | default .json
└── app/
    ├── app.module.ts                 # root module + APP_INITIALIZER
    ├── app-routing.module.ts         # landing | toolkit (lazy) | wildcard
    ├── landing-page/                 # pre-login, checks existing Keycloak session
    ├── main-app/                     # lazy "toolkit" shell, guarded by AuthguardService
    ├── core/                         # singletons: layout, services, models
    └── features/                     # lazy: dashboard, project, collections, test-data, test-run
```

`src/app/core/services/`: `data-service.ts` (sole REST gateway — components don't call `HttpClient` directly) · `httpinterceptor.ts` (`AuthInterceptor`, attaches web/Android credentials) · `authservice.service.ts`/`authguard.service.ts` · `sbi-testcase-service.ts` + `-android-service.ts` (mirror both when changing SBI orchestration) · `sdk-testcase-service.ts` · `abis-testcase-service.ts` + `activemq-service.ts`/`rx-stomp*.ts`.

`android/` is the tracked Capacitor-generated native project (synced via `npx cap sync`, not a build artifact) — see [`android/AGENTS.md`](android/AGENTS.md). `helm/` is the deploy chart — see [`helm/AGENTS.md`](helm/AGENTS.md).

## Development Workflow

- Integration branch: `develop`; releases: `release-<version>` (e.g. `release-1.4.x`).
- `push-trigger.yml` builds/dockerizes on push to `develop`/`master`/`release-1*`/`1.*` and on PRs (via `mosip/kattu` reusable workflows). `android.yml` builds the APK on `develop` push or manual dispatch. `chart-lint-publish.yml` lints/publishes `helm/**` on change.
- Before opening a PR: run `npm test` and the prod `ng build` locally.

## Pull Request Guidelines

- Target `develop` unless backporting to a release branch.
- Backend contract changes (request/response shapes, new endpoints) → note the corresponding [mosip-compliance-toolkit](https://github.com/mosip/mosip-compliance-toolkit) change in the PR.
- Android-affecting changes (Capacitor plugins, `android/`, `.env`/`environment.android.ts`) → call out explicitly so Android CI runs.
- Sign off commits (`git commit -s`).

## Repository-Specific Considerations

- Routing is hash-based (`useHash: true`) — relevant when adding top-level routes/deep links.
- `dist/`, `node_modules/`, `/.angular/cache` are gitignored build artifacts — don't hand-edit or commit them.
