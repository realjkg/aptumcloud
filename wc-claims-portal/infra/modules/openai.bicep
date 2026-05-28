param name string
param location string
param modelName string
param modelVersion string
param deploymentName string
param capacityK int
param environment string

resource account 'Microsoft.CognitiveServices/accounts@2023-10-01-preview' = {
  name: name
  location: location
  kind: 'OpenAI'
  sku: {
    name: 'S0'
  }
  properties: {
    customSubDomainName: name
    publicNetworkAccess: 'Enabled'
    // Restrict to your landing zone's allowed networks if required by policy
    // networkAcls: { defaultAction: 'Deny', ipRules: [], virtualNetworkRules: [] }
  }
  tags: {
    workload: 'wc-claims-portal'
    environment: environment
  }
}

resource deployment 'Microsoft.CognitiveServices/accounts/deployments@2023-10-01-preview' = {
  parent: account
  name: deploymentName
  sku: {
    name: 'Standard'
    capacity: capacityK
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: modelName
      version: modelVersion
    }
    versionUpgradeOption: 'OnceNewDefaultVersionAvailable'
  }
}

output endpoint string = account.properties.endpoint
output deploymentName string = deployment.name
output accountName string = account.name
