# AGENTS.md

## Repository Overview

This repository contains the **Angular web (and Android) front-end for the MOSIP Compliance Toolkit (CTK)** — the "Compliance Toolkit Portal". CTK lets technology partners test whether their biometric products comply with MOSIP specifications, and lets MOSIP administrators review and approve the resulting compliance reports.

It supports three project types, mirroring the backend [mosip-compliance-toolkit](https://github.com/mosip/mosip-compliance-toolkit) service:

- **SBI** (Secure Biometric Interface) — biometric capture devices, driven locally (web) or via an on-device intent (Android)
- **SDK** (Software Development Kit) — a biometric matching/quality SDK exposed as a `biosdk-service` REST endpoint
- **ABIS** (Automated Biometric Identification System) — communicates asynchronously over ActiveMQ for insert/identify operations

The UI does not implement compliance rules itself — it orchestrates test execution: pulls test cases from the backend, drives the target product, sends responses back to the backend for validation, stores the run, and renders pass/fail reports. For a product overview, see [docs.mosip.io/compliance-tool-kit](https://docs.mosip.io/compliance-tool-kit).

## Technology Stack

- **Angular 13.3** (TypeScript ~4.6), **Angular Material 13**, **Angular CLI ~13.3.2** (per `package.json`/README) for local/web development. Note: `.github/workflows/android.yml` installs Angular CLI `13.0.0` specifically for the Android build — this is a real version split between local tooling and Android CI, not a typo in one place; if you touch either, confirm whether the split is still intentional before aligning them.
- **@ngx-translate** for i18n (English/Arabic/French, RTL-aware)
- **Keycloak**-based authentication (cookie/JWT on web; a dedicated `android-keycloak` handler for the Android app)
- **`@stomp/rx-stomp` + `stompjs`** for ActiveMQ messaging (ABIS flow)
- **Capacitor 4** (`@capacitor/*`, `mosip-sbi-capacitor-plugin`) to package the same codebase as an **Android app** (`android/`) that talks to on-device SBI hardware
- **Karma + Jasmine** for unit tests
- Production build is served by **nginx** (see `Dockerfile`, `nginx.conf`, `default.conf`)
- **Node 14.17.3 / npm 6.14.13** recommended (per README)

## Build & Test Commands

Run from the repository root:

```shell
# Install dependencies
npm install

# Dev server (http://localhost:4200)
npm start

# Dev server via proxy, to avoid CORS against a real backend
ng serve --proxy-config proxy.conf.json

# Production build (output to dist/)
ng build "--prod" "--base-href" "." "--output-path=dist"

# Unit tests (Karma + Jasmine)
npm test

# Static analysis (requires sonar-scanner + SONAR_TOKEN)
npm run sonar
```

Build and run the Docker image:

```shell
docker build -t toolkitui .
docker run -d -p 8080:8080 --name toolkitui toolkitui
# UI now reachable at http://localhost:8080
```

There is no dedicated end-to-end/integration test suite in this repo — `npm test` runs Karma unit tests only.

## Configuration

Configuration is layered across a few files, all of which are **environment-specific and get overridden per deployment**:

- `src/assets/config.json` (tracked) — runtime config loaded via `APP_INITIALIZER`/`AppConfigService` before the app renders: `SERVICES_BASE_URL`, `SBI_BASE_URL`, `SDK_BASE_URL`, `toolkitUiUrl`, `login`/`logout` paths. Locally this points at the `ng serve` proxy (`/proxyapi/`); in production it is replaced to point at the real backend. `AppConfigService` also merges server-side config (session timeouts, admin roles, RTL language list) from the backend `configs` endpoint on top of this file.
- `proxy.conf.json` — Angular CLI dev-server proxy config used to avoid CORS locally; not committed by default (create it per the README, pointing `target` at the backend services URL).
- `.env` — local-only environment variables consumed by the Android build (`NX_APP_SERVICES_BASE_URL`, `NX_APP_IAM_URL`, `NX_APP_IAM_REALM`, `NX_APP_IAM_CLIENT_ID`). **This file is not covered by `.gitignore`** — take care never to `git add` it; the Android CI workflow (`.github/workflows/android.yml`) sets the equivalent values as GitHub Actions env vars via `workflow_dispatch` inputs instead.
- `src/environments/environment*.ts` (`environment.ts`, `.prod.ts`, `.android.ts`) — build-time Angular environment files; `environment.isAndroidAppMode` switches the app between web and Android behavior (e.g. Android reads `SERVICES_BASE_URL` from `environment.android.ts` instead of `config.json`).

Because none of these files should carry real credentials or environment-specific secrets in version control, double-check `git status`/`git diff` before committing changes near `config.json`, `.env`, or `environment.*.ts`.

## Project Structure Notes

```text
src/
├── main.ts, index.html, styles.css   # bootstrap + global styles
├── environments/                     # environment.ts | .prod.ts | .android.ts
├── assets/
│   ├── config.json                   # runtime config (overridden per environment)
│   └── i18n/                         # eng.json | ara.json | fra.json | default.json
└── app/
    ├── app.module.ts                 # root module + APP_INITIALIZER
    ├── app-routing.module.ts         # top-level routes: landing | toolkit (lazy) | wildcard
    ├── landing-page/                 # pre-login page, checks for an existing Keycloak session
    ├── main-app/                     # lazy "toolkit" shell module + routing, guarded by AuthguardService
    ├── core/                         # singletons: layout, services, models (see below)
    └── features/                     # lazy feature modules: dashboard, project, collections, test-data, test-run
```

Key core services under `src/app/core/services/`:

- `data-service.ts` — the single REST gateway; every backend endpoint call lives here, components don't call `HttpClient` directly for the backend
- `httpinterceptor.ts` (`AuthInterceptor`) — attaches credentials/XSRF token (web) or Capacitor cookie/header (Android) to every backend call
- `authservice.service.ts` / `authguard.service.ts` — route guard for the `toolkit` area
- `sbi-testcase-service.ts` / `sbi-testcase-android-service.ts` — orchestrate SBI test cases (web vs. Android)
- `sdk-testcase-service.ts` — orchestrates SDK test cases against `biosdk-service`
- `abis-testcase-service.ts` + `activemq-service.ts` / `rx-stomp*.ts` — orchestrate ABIS test cases over STOMP/ActiveMQ

`android/` contains the Capacitor-generated native Android project (synced via `npx cap sync`); it is a tracked part of the repo, not a build artifact — don't delete or regenerate it casually.

## Development Workflow

- Default integration branch is `develop`; release branches follow `release-<version>` naming (e.g. `release-1.4.x`).
- `.github/workflows/push-trigger.yml` builds and dockerizes the app on pushes to `develop`, `master`, `release-1*`, and `1.*`, and on pull requests, via reusable workflows in `mosip/kattu` (`npm-build.yml`, `docker-build.yml`, `npm-sonar-analysis.yml`).
- `.github/workflows/android.yml` builds the Android APK on pushes to `develop` (or manual `workflow_dispatch`), setting `NX_APP_*` env vars and running `ng build -c=android` followed by a Gradle build via Capacitor.
- `.github/workflows/chart-lint-publish.yml` lints/publishes the Helm charts under `helm/` when that path changes.
- Before opening a PR, run `npm test` and `ng build "--prod" "--base-href" "." "--output-path=dist"` locally to confirm the app still builds and unit tests pass.

## Pull Request Guidelines

- Target the `develop` branch unless the change is specifically a backport/fix for a release branch.
- If a change affects a backend contract (request/response shapes, new endpoints), check whether it needs a corresponding change in [mosip-compliance-toolkit](https://github.com/mosip/mosip-compliance-toolkit) and note that in the PR description.
- If a change affects the Android build (Capacitor plugins, `android/` project, `.env`/`environment.android.ts`), call that out explicitly so the Android CI workflow gets exercised.
- Sign off commits (`git commit -s`) per MOSIP contribution conventions.

## Repository-Specific Considerations

- The UI's "compliance verdict" always comes from the backend (`validateRequest`/`validateResponse`); this app's job is limited to collecting the real product's behavior and feeding it to those backend validators, then presenting the result. Don't add client-side pass/fail logic that duplicates backend validation.
- Web vs. Android behavior is branched via `environment.isAndroidAppMode`; when touching SBI test-case orchestration, check whether the change needs mirroring in both `sbi-testcase-service.ts` (web) and `sbi-testcase-android-service.ts` (Android).
- Routing uses hash-based navigation (`useHash: true` in `app-routing.module.ts`); keep that in mind when adding new top-level routes or deep links.
- `dist/`, `node_modules/`, and `/.angular/cache` are gitignored build artifacts — don't hand-edit or commit them.
