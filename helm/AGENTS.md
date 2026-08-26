# AGENTS.md — `helm/`

> Kubernetes Helm chart for deploying the Compliance Toolkit Portal (`compliance-toolkit-ui`).
> Parent guide: [repo root `AGENTS.md`](../AGENTS.md).

---

## 1. Purpose

Packages the built Angular app (served by nginx, see repo-root `Dockerfile`) as a Helm chart — a
thin deployment wrapper, no application source here. Linted/published to `mosip-helm`
(`https://mosip.github.io/mosip-helm`) by `.github/workflows/chart-lint-publish.yml` on any
`helm/**` push, PR, or release.

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

`values.yaml`'s `image.repository: mosipdev/compliance-toolkit-ui` is the same image the repo-root
`Dockerfile` builds — keep `Chart.yaml`'s `version` and `install.sh`'s `CHART_VERSION` in sync on
release.

## 3. How to run

```shell
# From helm/compliance-toolkit-ui/, against a cluster with kubectl/helm access:
./install.sh [kubeconfig-path]      # ns "compliance-toolkit", copy configmaps, helm install
./restart.sh [kubeconfig-path]      # rolling restart
./delete.sh                         # helm uninstall (prompts for confirmation)
```

`install.sh` expects `global`/`artifactory-share`/`config-server-share` configmaps to already
exist in their source namespaces (`copy_cm.sh` copies them); it reads `mosip-api-internal-host`
and `mosip-compliance-host` off the cluster's `global` configmap for `compliance.apiHost` and the
Istio `hosts` value.

Chart lint/publish is CI-driven (`chart-lint-publish.yml`, `mosip/kattu`, `CHARTS_DIR: ./helm`) —
no local wrapper script. For a local check, from `helm/` (not `helm/compliance-toolkit-ui/`):

```shell
cd helm
helm lint compliance-toolkit-ui
helm template compliance-toolkit-ui compliance-toolkit-ui
```

## 4. Agent rules — Do / Do not

### Do

- Bump `Chart.yaml`'s `version` on release-affecting template/`values.yaml` changes, keeping
  `install.sh`'s `CHART_VERSION` in sync.
- Keep `values.yaml`'s `image.repository`/`tag` pointed at the repo-root `Dockerfile`'s image.
- Test template changes with `helm template compliance-toolkit-ui compliance-toolkit-ui` (from
  `helm/`) before committing.

### Do not

- Don't hardcode env-specific hosts (`api-internal.sandbox.xyz.net`, etc.) as anything but sample
  defaults in `values.yaml` — real values come from `install.sh`'s `--set` overrides, sourced from
  cluster configmaps. Never commit real secrets or per-env hostnames.
- Don't remove/rename `copy_cm.sh`/`copy_cm_func.sh` without updating `install.sh`'s relative-path
  calls to them.
- Don't run `delete.sh` against a shared/production namespace without confirming with the cluster
  owner — it uninstalls the whole release.
