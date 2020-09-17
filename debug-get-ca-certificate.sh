set -e #-e exit immediately if pipeline return non zero status
#set -x #-x print trace of commands
set -u #-u treat unset variable and parameter as error
#-o set option pipefail If set, the return value of a pipeline is the value of the last (rightmost) command to exit with a non-zero status
set -o pipefail

if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Retrieving CA certificate on mac os from cluster..." 
    oc get secrets -n default --field-selector type=kubernetes.io/service-account-token -o json | \
    jq '.items[0].data."ca.crt"' -r | python -m base64 -d > examples/ca.crt
else
    echo "Retrieving CA certificate on linux from cluster..." 
    oc get secrets -n default --field-selector type=kubernetes.io/service-account-token -o json | \
    jq '.items[0].data."ca.crt"' -r | python -m base64 -d > examples/ca.crt
    # Note: use "openssl base64" because the "base64" tool is different between mac and linux
fi
