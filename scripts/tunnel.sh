#!/bin/bash

# Ork8stra LocalTunnel Exposer
# This script securely exposes a local Kubelite application to the public internet using localtunnel.

if [ -z "$1" ]; then
    echo "Usage: ./scripts/tunnel.sh <URL>"
    echo "Example: ./scripts/tunnel.sh https://nodebulletinboard.project10.192.168.58.2.sslip.io"
    exit 1
fi

URL=$1
# Strip https:// or http:// and trailing slashes
HOST=$(echo "$URL" | sed -e 's|^[^/]*//||' -e 's|/.*$||')
# Create a unique subdomain based on the host prefix (e.g., nodebulletinboard)
PREFIX=$(echo "$HOST" | cut -d. -f1-2 | sed 's/\.//g')

echo "🚀 Starting global secure tunnel to: $HOST"
echo "🌐 Your local application will be available securely anywhere."
echo "Press Ctrl+C to stop the tunnel."
echo "------------------------------------------------------------"

# Using localtunnel. The --local-host flag is critical so that the ingress NGINX 
# controller receives the correct Host header for routing.
npx -y localtunnel --port 80 --local-host "$HOST" --subdomain "kubelite-$PREFIX-$RANDOM"
