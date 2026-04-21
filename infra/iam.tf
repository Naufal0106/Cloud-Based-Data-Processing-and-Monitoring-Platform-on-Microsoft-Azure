# =================================================================
# LUARAN 9: DOKUMEN KONFIGURASI IAM (Identity & Access Management)
# Mengatur hak akses tim berdasarkan prinsip Least Privilege
# =================================================================

# 1. Akses untuk Rendy Saputra (Security Engineer)
# Bertanggung jawab mengatur kebijakan IAM & keamanan 
resource "azurerm_role_assignment" "role_rendy" {
  scope                = azurerm_resource_group.rg.id
  role_definition_name = "Contributor"
  principal_id         = var.id_rendy  
}

# 2. Akses untuk Muhammad Arifin Ilham (Backend Developer)
# Bertanggung jawab untuk integrasi database & fungsi backend [cite: 256]
resource "azurerm_role_assignment" "role_arifin" {
  scope                = azurerm_resource_group.rg.id
  role_definition_name = "Contributor"
  principal_id         = var.id_arifin 
}

# 3. Akses untuk Zhykwa Ceryl Mavanudin (Cloud Architect)
# Bertanggung jawab merancang arsitektur & konfigurasi VNet [cite: 255]
resource "azurerm_role_assignment" "role_zhykwa" {
  scope                = azurerm_resource_group.rg.id
  role_definition_name = "Contributor"
  principal_id         = var.id_zhykwa
}