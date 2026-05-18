# 1. Storage Account untuk Hosting Dashboard Statis
resource "azurerm_storage_account" "storage_web" {
  name                     = "stwebdashboardk11" # Nama harus unik
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = azurerm_resource_group.rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  # Mengaktifkan fitur Static Website
  static_website {
    index_document     = "index.html"
    error_404_document = "index.html"
  }

  tags = local.common_tags
}
