#!/bin/bash
# setup-local-security.sh - Automates CA trust and DNS verification

MINIKUBE_IP=$(minikube ip)
CA_SECRET_NAME="kubelite-selfsigned-ca" # Default for cert-manager selfsigned
NAMESPACE="cert-manager"

echo "1. Exporting Kubelite Root CA..."
kubectl get secret ${CA_SECRET_NAME} -n ${NAMESPACE} -o jsonpath='{.data.ca\.crt}' | base64 -d > kubelite-ca.crt

echo "2. instructions to trust CA locally:"
echo "--------------------------------------------------"
echo "On Linux (Chrome/Firefox/System):"
echo "  sudo cp kubelite-ca.crt /usr/local/share/ca-certificates/kubelite.crt"
echo "  sudo update-ca-certificates"
echo ""
echo "Or import 'kubelite-ca.crt' into your browser's Certificate Manager (Settings -> Privacy -> Security -> Certificates)"
echo "--------------------------------------------------"

echo "3. DNS Automation verification (sslip.io)"
echo "Testing resolution for nodebulletinboard.project10.${MINIKUBE_IP}.sslip.io..."
nslookup nodebulletinboard.project10.${MINIKUBE_IP}.sslip.io

echo -e "\nSetup Complete."
