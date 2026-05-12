# ---------------------------------------------------------------------------
# Private endpoints for the AI plane (into snet-privateendpoints).
# The Private DNS zones are platform-owned and were linked to the spoke VNet by
# the application-platform module, so name resolution Just Works.
# ---------------------------------------------------------------------------

locals {
  pe_subnet_id = var.spoke_subnet_ids["private_endpoints"]
}

resource "azurerm_private_endpoint" "openai" {
  name                = "pe-aoai-insurance-app"
  location            = azurerm_resource_group.ai.location
  resource_group_name = azurerm_resource_group.ai.name
  subnet_id           = local.pe_subnet_id
  tags                = local.common_tags

  private_service_connection {
    name                           = "psc-aoai"
    private_connection_resource_id = azurerm_cognitive_account.openai.id
    subresource_names              = ["account"]
    is_manual_connection           = false
  }
}

resource "azurerm_private_endpoint" "content_safety" {
  name                = "pe-acs-insurance-app"
  location            = azurerm_resource_group.ai.location
  resource_group_name = azurerm_resource_group.ai.name
  subnet_id           = local.pe_subnet_id
  tags                = local.common_tags

  private_service_connection {
    name                           = "psc-acs"
    private_connection_resource_id = azurerm_cognitive_account.content_safety.id
    subresource_names              = ["account"]
    is_manual_connection           = false
  }
}

resource "azurerm_private_endpoint" "search" {
  name                = "pe-srch-insurance-app"
  location            = azurerm_resource_group.ai.location
  resource_group_name = azurerm_resource_group.ai.name
  subnet_id           = local.pe_subnet_id
  tags                = local.common_tags

  private_service_connection {
    name                           = "psc-srch"
    private_connection_resource_id = azurerm_search_service.grounding.id
    subresource_names              = ["searchService"]
    is_manual_connection           = false
  }
}

resource "azurerm_private_endpoint" "ai_storage_blob" {
  name                = "pe-stinsai-blob"
  location            = azurerm_resource_group.ai.location
  resource_group_name = azurerm_resource_group.ai.name
  subnet_id           = local.pe_subnet_id
  tags                = local.common_tags

  private_service_connection {
    name                           = "psc-stinsai-blob"
    private_connection_resource_id = azurerm_storage_account.ai.id
    subresource_names              = ["blob"]
    is_manual_connection           = false
  }
}

resource "azurerm_private_endpoint" "ai_foundry_hub" {
  name                = "pe-aif-insurance-app"
  location            = azurerm_resource_group.ai.location
  resource_group_name = azurerm_resource_group.ai.name
  subnet_id           = local.pe_subnet_id
  tags                = local.common_tags

  private_service_connection {
    name                           = "psc-aif"
    private_connection_resource_id = azurerm_ai_foundry.hub.id
    subresource_names              = ["amlworkspace"]
    is_manual_connection           = false
  }
}

# APIM private endpoint (the gateway itself is VNet-injected internal mode — see
# connectors-apim.tf; this PE is for the developer/management plane if needed).
resource "azurerm_private_endpoint" "apim" {
  name                = "pe-apim-insurance-app"
  location            = azurerm_resource_group.workload.location
  resource_group_name = azurerm_resource_group.workload.name
  subnet_id           = local.pe_subnet_id
  tags                = local.common_tags

  private_service_connection {
    name                           = "psc-apim"
    private_connection_resource_id = azurerm_api_management.connectors.id
    subresource_names              = ["Gateway"]
    is_manual_connection           = false
  }
}
