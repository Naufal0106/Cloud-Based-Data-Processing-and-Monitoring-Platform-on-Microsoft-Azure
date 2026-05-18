# 1. Traffic Manager Profile (Perbaikan di Monitor Config)
resource "azurerm_traffic_manager_profile" "lb" {
  name                   = "tm-monitoring-k11"
  resource_group_name    = azurerm_resource_group.rg.name
  traffic_routing_method = "Priority"

  dns_config {
    relative_name = "k11-monitoring-platform"
    ttl           = 60
  }

  monitor_config {
    protocol                     = "HTTP"
    port                         = 80
    path                         = "/"
    interval_in_seconds          = 30
    timeout_in_seconds           = 9
    tolerated_number_of_failures = 3
  }
}

# 2. Endpoint Frontend (VM)
resource "azurerm_traffic_manager_external_endpoint" "vm_endpoint" {
  name              = "endpoint-frontend-vm"
  profile_id        = azurerm_traffic_manager_profile.lb.id
  weight            = 100
  target            = "frontend-monitoring-k11.southeastasia.cloudapp.azure.com"
  endpoint_location = azurerm_resource_group.rg.location
  priority          = 1 # Utama: Traffic bakal selalu ke sini dulu
}

# 3. Endpoint Backend (Function App)
resource "azurerm_traffic_manager_external_endpoint" "func_endpoint" {
  name              = "endpoint-backend-function"
  profile_id        = azurerm_traffic_manager_profile.lb.id
  weight            = 100
  target            = "${azurerm_linux_function_app.func_app.name}.azurewebsites.net"
  endpoint_location = azurerm_resource_group.rg.location
  priority          = 2 # Backup: Kalau VM mati, baru lari ke sini
}

# 4. Endpoint Storage Account
resource "azurerm_traffic_manager_external_endpoint" "storage_endpoint" {
  name              = "endpoint-storage-backup"
  profile_id        = azurerm_traffic_manager_profile.lb.id
  weight            = 50
  target            = "stwebdashboardk11.z23.web.core.windows.net"
  endpoint_location = azurerm_resource_group.rg.location
  priority          = 3 # Backup kedua: Kalau VM & Function mati
}
