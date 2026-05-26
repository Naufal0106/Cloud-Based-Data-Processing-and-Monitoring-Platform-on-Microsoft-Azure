# ================================================================
# Azure Traffic Manager - Backend Failover Routing
# ================================================================

resource "azurerm_traffic_manager_profile" "lb" {
  name                   = "tm-monitoring-k11"
  resource_group_name    = azurerm_resource_group.rg.name
  traffic_routing_method = "Priority"

  dns_config {
    relative_name = "k11-monitoring-platform"
    ttl           = 60
  }

  monitor_config {
    protocol                     = "HTTPS"
    port                         = 443
    path                         = "/api/hello"
    interval_in_seconds          = 30
    timeout_in_seconds           = 9
    tolerated_number_of_failures = 3
  }

  tags = local.common_tags
}

# Primary backend: Azure Functions
# Nama endpoint sengaja tetap "endpoint-backend-function"
# supaya tidak recreate endpoint lama.
resource "azurerm_traffic_manager_external_endpoint" "func_endpoint" {
  name              = "endpoint-backend-function"
  profile_id        = azurerm_traffic_manager_profile.lb.id
  target            = "${azurerm_linux_function_app.func_app.name}.azurewebsites.net"
  endpoint_location = "Southeast Asia"

  priority = 1
  weight   = 100
}

# Secondary backend: Azure App Service backup
resource "azurerm_traffic_manager_external_endpoint" "backup_appservice_endpoint" {
  name              = "secondary-backend-appservice"
  profile_id        = azurerm_traffic_manager_profile.lb.id
  target            = "${azurerm_windows_web_app.backup_backend.name}.azurewebsites.net"
  endpoint_location = "Southeast Asia"

  priority = 2
  weight   = 100
}