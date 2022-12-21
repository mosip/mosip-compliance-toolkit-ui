#!/bin/sh
# Installs all compliance-toolkit helm charts
## Usage: ./install.sh [kubeconfig]

if [ $# -ge 1 ] ; then
  export KUBECONFIG=$1
fi

NS=compliance-toolkit

echo Create $NS namespace
kubectl create ns $NS

echo Updating Helm Dependencies
helm dependency update

echo Istio label
kubectl label ns $NS istio-injection=disabled --overwrite
helm repo update

echo Copy configmaps
./copy_cm.sh

API_HOST=$(kubectl get cm global -o jsonpath={.data.mosip-api-internal-host})
COMPLIANCE_HOST=$(kubectl get cm global -o jsonpath={.data.mosip-compliance-host})

echo Installing compliance-toolkit-ui
helm -n $NS install compliance-toolkit-ui . --set compliance.apiHost=$API_HOST --set istio.hosts\[0\]=$COMPLIANCE_HOST 

kubectl -n $NS get deploy -o name | xargs -n1 -t kubectl -n $NS rollout status

echo Installed compliance-toolkit services
echo "compliance-toolkit-ui portal URL: https://$COMPLIANCE_HOST/"
