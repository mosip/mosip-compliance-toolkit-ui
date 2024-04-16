#!/bin/bash
# Installs all compliance-toolkit helm charts
## Usage: ./install.sh [kubeconfig]

if [ $# -ge 1 ] ; then
  export KUBECONFIG=$1
fi

NS=compliance-toolkit
CHART_VERSION=1.4.0

echo Create $NS namespace
kubectl create ns $NS

function installing_compliance-toolkit-ui() {
  echo Istio label
  kubectl label ns $NS istio-injection=disabled --overwrite
  helm repo add mosip https://mosip.github.io/mosip-helm
  helm repo update

  echo Copy configmaps
  ./copy_cm.sh

  API_HOST=$(kubectl get cm global -o jsonpath={.data.mosip-api-internal-host})
  COMPLIANCE_HOST=$(kubectl get cm global -o jsonpath={.data.mosip-compliance-host})

  echo Installing compliance-toolkit-ui
  helm -n $NS install compliance-toolkit-ui mosip/compliance-toolkit-ui --set compliance.apiHost=$API_HOST --set istio.hosts\[0\]=$COMPLIANCE_HOST --version $CHART_VERSION

  kubectl -n $NS get deploy -o name | xargs -n1 -t kubectl -n $NS rollout status

  echo Installed compliance-toolkit services
  echo "compliance-toolkit-ui portal URL: https://$COMPLIANCE_HOST/"
  return 0
}

# set commands for error handling.
set -e
set -o errexit   ## set -e : exit the script if any statement returns a non-true return value
set -o nounset   ## set -u : exit the script if you try to use an uninitialised variable
set -o errtrace  # trace ERR through 'time command' and other functions
set -o pipefail  # trace ERR through pipes
installing_compliance-toolkit-ui   # calling function
