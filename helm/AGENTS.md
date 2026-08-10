# AGENTS.md — `helm/`

> Kubernetes Helm chart for deploying the Compliance Toolkit Portal (`compliance-toolkit-ui`).
> Parent guide: [repo root `AGENTS.md`](../AGENTS.md).

---

## 1. Purpose

This folder packages the built Angular app (served by nginx, see the repo-root `Dockerfile`) as a
Helm chart for installation into a MOSIP Kubernetes cluster. It is a thin deployment wrapper — no
application source lives here. Charts are linted and published to the `mosip-helm` repo
(`https://mosip.github.io/mosip-helm`) by `.github/workflows/chart-lint-publish.yml` whenever
`helm/**` changes on a push, PR, or release.

## 2. Layout

```text
helm/
└── compliance-toolkit-ui/
    ├── Chart.yaml           # chart name/version, depends on bitnami "common" library chart
    ├── values.yaml          # image, service, probes, istio gateway, resource limits
    ├── copy_cm.sh            # copies shared configmaps (global, artifactory, config-server) into namespace
    ├── copy_cm_func.sh       # helper invoked by copy_cm.sh
    ├── install.sh            # creates namespace, copies configmaps, helm install
    ├── restart.sh            # rollout restart of the deployment
    ├── delete.sh              # helm uninstall (interactive confirm)
    └── templates/
        ├── deployment.yaml, service.yaml, serviceaccount.yaml
        ├── configmap.yaml, gateway.yaml, virtualservice.yaml
        ├── servicemonitor.yaml, _helpers.tpl, NOTES.txt
```

The image referenced by `values.yaml` (`image.repository: mosipdev/compliance-toolkit-ui`) is the
same Docker image built from the repo-root `Dockerfile` — keep `Chart.yaml`'s `version` and
`install.sh`'s `CHART_VERSION` in sync when cutting a release.

## 3. How to run

```shell
# From helm/compliance-toolkit-ui/, against a cluster you have kubectl/helm access to:
./install.sh [kubeconfig-path]      # create ns "compliance-toolkit", copy configmaps, helm install
./restart.sh [kubeconfig-path]      # rolling restart of the deployment
./delete.sh                         # helm uninstall (prompts for confirmation)
```

`install.sh` expects the `global`, `artifactory-share`, and `config-server-share` configmaps to
already exist in the source namespaces it copies from (`copy_cm.sh` handles the copy); it reads
`mosip-api-internal-host` and `mosip-compliance-host` off the cluster's `global` configmap to wire
up `compliance.apiHost` and the Istio `hosts` value.

Chart lint/publish itself is CI-driven — see `.github/workflows/chart-lint-publish.yml`
(`mosip/kattu` reusable workflow, `CHARTS_DIR: ./helm`); there is no local `helm lint` wrapper
script in this folder. For a local check, run from `helm/` (not from inside
`helm/compliance-toolkit-ui/`):

```shell
cd helm
helm lint compliance-toolkit-ui
helm template compliance-toolkit-ui compliance-toolkit-ui
```

## 4. Agent rules — Do / Do not

### Do

- Bump `Chart.yaml`'s `version` whenever chart templates or `values.yaml` change in a
  release-affecting way, and keep `install.sh`'s `CHART_VERSION` in sync.
- Keep `image.repository`/`tag` in `values.yaml` pointed at the same image the Dockerfile in the
  repo root produces.
- Test template changes with `helm template compliance-toolkit-ui compliance-toolkit-ui` (run from `helm/`) before committing.
- Reference the parent guide ([`../AGENTS.md`](../AGENTS.md)) for how the UI itself is built and
  configured (`src/assets/config.json`, environment files) — this chart only deploys the built
  artifact, it does not configure app behavior beyond env/configmap wiring.

### Do not

- Do not hardcode environment-specific hosts (`api-internal.sandbox.xyz.net`,
  `compliance.sandbox.xyz.net`) as anything other than sample defaults in `values.yaml` — real
  values come from `--set` overrides in `install.sh`, sourced from cluster configmaps.
  Do not copy real deployment secrets or per-environment host names into git.
- Do not remove or rename `copy_cm.sh` / `copy_cm_func.sh` without also updating `install.sh`,
  which calls them by relative path.
- Do not run `delete.sh` against a shared/production namespace without confirming with the
  cluster owner — it uninstalls the whole release.
