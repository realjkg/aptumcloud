targetScope = 'subscription'

@description('Short environment tag (dev | staging | prod)')
param environment string = 'dev'

@description('Azure region for all resources')
param location string = 'eastus2'

@description('Workload prefix used in all resource names')
param prefix string = 'adaptcloud'

@description('GPT model to deploy — must be available in the chosen region')
param openAiModelName string = 'gpt-4o'

@description('Model version — verify availability in your region before changing')
param openAiModelVersion string = '2024-05-13'

@description('Tokens-per-minute capacity (thousands) for the model deployment')
param openAiCapacityK int = 30

// ── Names ────────────────────────────────────────────────────────────────────

var rgName      = 'rg-${prefix}-wc-claims-${environment}'
var openAiName  = 'oai-${prefix}-wc-claims-${environment}'
var swaName     = 'swa-${prefix}-wc-claims-${environment}'
var deploymentName = openAiModelName   // deployment name matches the model for simplicity

// ── Resource group ───────────────────────────────────────────────────────────

resource rg 'Microsoft.Resources/resourceGroups@2023-07-01' = {
  name: rgName
  location: location
  tags: {
    workload: 'wc-claims-portal'
    environment: environment
    managedBy: 'bicep'
  }
}

// ── Modules ───────────────────────────────────────────────────────────────────

module openai 'modules/openai.bicep' = {
  name: 'openai'
  scope: rg
  params: {
    name: openAiName
    location: location
    modelName: openAiModelName
    modelVersion: openAiModelVersion
    deploymentName: deploymentName
    capacityK: openAiCapacityK
    environment: environment
  }
}

module swa 'modules/staticwebapp.bicep' = {
  name: 'swa'
  scope: rg
  params: {
    name: swaName
    location: location
    environment: environment
  }
}

// ── Outputs ───────────────────────────────────────────────────────────────────

@description('Resource group name')
output resourceGroup string = rg.name

@description('Azure OpenAI endpoint — set as AZURE_OPENAI_ENDPOINT in SWA + GitHub secrets')
output openAiEndpoint string = openai.outputs.endpoint

@description('Azure OpenAI deployment name — set as AZURE_OPENAI_DEPLOYMENT_NAME')
output openAiDeploymentName string = openai.outputs.deploymentName

@description('Static Web App default hostname — set as NEXTAUTH_URL (prefix with https://)')
output swaHostname string = swa.outputs.hostname

@description('Static Web App deployment token — set as AZURE_STATIC_WEB_APPS_API_TOKEN in GitHub secrets')
@secure()
output swaDeploymentToken string = swa.outputs.deploymentToken
