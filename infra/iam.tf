# =================================================================
# LUARAN 9: DOKUMEN KONFIGURASI IAM (Identity & Access Management)
# Mengatur hak akses tim berdasarkan prinsip Least Privilege
# =================================================================

# 1. Akses untuk Naufal (DevOps Engineer)
# Role Utama: Owner untuk manajemen administratif total
resource "azurerm_role_assignment" "role_naufal_owner" {
  scope                = azurerm_resource_group.rg.id
  role_definition_name = "Owner"
  principal_id         = var.id_naufal
}

# Role Spesifik: Mengelola sistem monitoring dan observabilitas
resource "azurerm_role_assignment" "role_naufal_monitoring" {
  scope                = azurerm_resource_group.rg.id
  role_definition_name = "Monitoring Contributor"
  principal_id         = var.id_naufal
}

# Role Spesifik: Mengelola anggaran dan optimasi biaya operasional
resource "azurerm_role_assignment" "role_naufal_cost" {
  scope                = azurerm_resource_group.rg.id
  role_definition_name = "Cost Management Contributor"
  principal_id         = var.id_naufal
}

# 2. Akses untuk Rendy Saputra (Security Engineer)
# Hanya bisa mengelola kebijakan keamanan dan audit
resource "azurerm_role_assignment" "role_rendy" {
  scope                = azurerm_resource_group.rg.id
  role_definition_name = "Security Admin"
  principal_id         = var.id_rendy
}

# 3. Akses untuk Muhammad Arifin Ilham (Backend Developer)
# Role 1: Mengelola Database Cosmos DB
resource "azurerm_role_assignment" "role_arifin_db" {
  scope                = azurerm_resource_group.rg.id
  role_definition_name = "DocumentDB Account Contributor"
  principal_id         = var.id_arifin
}

# Role 2: Mengelola Azure Functions (Web/Serverless)
resource "azurerm_role_assignment" "role_arifin_web" {
  scope                = azurerm_resource_group.rg.id
  role_definition_name = "Website Contributor"
  principal_id         = var.id_arifin
}

# 4. Akses untuk Zhykwa Ceryl Mavanudin (Cloud Architect)
# Hanya bisa mengelola konfigurasi Jaringan (VNet, Subnet, NSG)
resource "azurerm_role_assignment" "role_zhykwa" {
  scope                = azurerm_resource_group.rg.id
  role_definition_name = "Network Contributor"
  principal_id         = var.id_zhykwa
}