#!/bin/sh
set -e

mkdir -p /data

if [ -f /data/workflow.json ]; then
  echo "Importing n8n workflow..."
  n8n import:workflow --input=/data/workflow.json || true
fi

exec n8n start
