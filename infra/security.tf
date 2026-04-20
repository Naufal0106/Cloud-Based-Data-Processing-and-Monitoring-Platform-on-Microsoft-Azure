# ================================================================
# 6. NSG SUBNET PUBLIK - Untuk Web Server / Command Center
#    Prinsip Least Privilege: hanya buka port yang benar-benar perlu
# ================================================================
resource "azurerm_network_security_group" "nsg_publik" {
  name                = "NSG-Publik-Kelompok11"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  # --- ATURAN MASUK (Inbound) ---

  # Izinkan HTTP (Port 80) dari internet
  security_rule {
    name                       = "Allow-HTTP"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "Internet"
    destination_address_prefix = "*"
  }

  # Izinkan HTTPS (Port 443) dari internet
  security_rule {
    name                       = "Allow-HTTPS"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "Internet"
    destination_address_prefix = "*"
  }

  # Izinkan SSH - Masukkan IP Publik kamu/Arifin di sini agar lebih aman
  security_rule {
    name                       = "Allow-SSH-AdminOnly"
    priority                   = 120
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "*" # Ganti ke IP asli kalian jika ingin sangat ketat
    destination_address_prefix = "*"
  }

  # BLOKIR semua traffic masuk lainnya (Default Deny)
  security_rule {
    name                       = "Deny-All-Inbound"
    priority                   = 4096
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  tags = local.common_tags
}

# Hubungkan NSG Publik ke Subnet Publik
resource "azurerm_subnet_network_security_group_association" "asosiasi_publik" {
  subnet_id                 = azurerm_subnet.public_subnet.id
  network_security_group_id = azurerm_network_security_group.nsg_publik.id
}

# ================================================================
# 7. NSG SUBNET PRIVAT - Untuk Database / Backend (Minggu 3)
#    Tidak boleh diakses langsung dari internet sama sekali
# ================================================================
resource "azurerm_network_security_group" "nsg_privat" {
  name                = "NSG-Privat-Kelompok11"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  # --- ATURAN MASUK (Inbound) ---

  # Izinkan traffic HANYA dari subnet publik (VM Command Center ke Database)
  security_rule {
    name                       = "Allow-Internal-Only"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "10.0.1.0/24" # Hanya dari subnet publik
    destination_address_prefix = "*"
  }

  # BLOKIR semua akses dari internet ke subnet privat
  security_rule {
    name                       = "Deny-Internet-To-Private"
    priority                   = 4096
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "Internet"
    destination_address_prefix = "*"
  }

  tags = local.common_tags
}

# Hubungkan NSG Privat ke Subnet Privat
resource "azurerm_subnet_network_security_group_association" "asosiasi_privat" {
  subnet_id                 = azurerm_subnet.private_subnet.id
  network_security_group_id = azurerm_network_security_group.nsg_privat.id
}