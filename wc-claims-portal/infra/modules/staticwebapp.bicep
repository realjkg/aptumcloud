param name string
param location string
param environment string

// Standard tier is required — Free tier does not support Next.js API routes
resource swa 'Microsoft.Web/staticSites@2023-01-01' = {
  name: name
  location: location
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
  properties: {
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
    enterpriseGradeCdnStatus: 'Disabled'
  }
  tags: {
    workload: 'wc-claims-portal'
    environment: environment
  }
}

output hostname string = swa.properties.defaultHostname
output swaName string = swa.name

@secure()
output deploymentToken string = swa.listSecrets().properties.apiKey
