#!/usr/bin/env bash
# Usage: ./infra/deploy.sh <subscription-id>
# Deploys the WC Claims Portal infrastructure to a dev landing zone.
# Requires: az CLI 2.50+, bicep CLI 0.24+, jq

set -euo pipefail

SUBSCRIPTION_ID="${1:?Usage: $0 <subscription-id>}"
DEPLOYMENT_NAME="wc-claims-portal-$(date +%Y%m%d%H%M%S)"

echo "==> Setting active subscription: $SUBSCRIPTION_ID"
az account set --subscription "$SUBSCRIPTION_ID"

echo "==> Validating Bicep template..."
az deployment sub validate \
  --location eastus2 \
  --template-file "$(dirname "$0")/main.bicep" \
  --parameters "$(dirname "$0")/main.bicepparam"

echo "==> Deploying infrastructure (this takes ~5 minutes)..."
OUTPUTS=$(az deployment sub create \
  --name "$DEPLOYMENT_NAME" \
  --location eastus2 \
  --template-file "$(dirname "$0")/main.bicep" \
  --parameters "$(dirname "$0")/main.bicepparam" \
  --query properties.outputs \
  --output json)

echo ""
echo "==> Deployment complete. Capture these values for GitHub secrets and SWA config:"
echo ""
echo "  AZURE_OPENAI_ENDPOINT:              $(echo "$OUTPUTS" | jq -r '.openAiEndpoint.value')"
echo "  AZURE_OPENAI_DEPLOYMENT_NAME:       $(echo "$OUTPUTS" | jq -r '.openAiDeploymentName.value')"
echo "  NEXTAUTH_URL (prefix https://):     $(echo "$OUTPUTS" | jq -r '.swaHostname.value')"
echo "  AZURE_STATIC_WEB_APPS_API_TOKEN:    $(echo "$OUTPUTS" | jq -r '.swaDeploymentToken.value')"
echo "  Resource group:                     $(echo "$OUTPUTS" | jq -r '.resourceGroup.value')"
echo ""
echo "Next: retrieve the OpenAI API key and set GitHub + SWA secrets (see README)."
