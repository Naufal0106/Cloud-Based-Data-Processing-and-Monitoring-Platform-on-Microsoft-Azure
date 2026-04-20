# Membuat Network Security Group (NSG)
resource "azurerm_network_security_group" "nsg_utama" {
  name                = "NSG-Kelompok11"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  # Aturan 1: Mengizinkan SSH (untuk remote akses)
  security_rule {
    name                       = "AllowSSH"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  # Aturan 2: Mengizinkan HTTP (untuk akses web aplikasi)
  security_rule {
    name                       = "AllowHTTP"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

# Menghubungkan NSG ke Subnet Publik
resource "azurerm_subnet_network_security_group_association" "link_nsg_public" {
  subnet_id                 = azurerm_subnet.public_subnet.id
  network_security_group_id = azurerm_network_security_group.nsg_utama.id
}