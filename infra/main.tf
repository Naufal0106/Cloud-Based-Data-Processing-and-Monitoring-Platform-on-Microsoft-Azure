# 1. Konfigurasi Terraform dan Provider Azure
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# 2. Membuat Resource Group (Wadah Besar Proyek)
resource "azurerm_resource_group" "rg" {
  name     = "RG-Kelompok11"
  location = "southeastasia" 
}

# 3. Membuat Virtual Network (VNet) - Fondasi Jaringan
resource "azurerm_virtual_network" "vnet" {
  name                = "VNet-Utama-Kelompok11"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
}

# 4. Membuat Subnet Publik (Untuk VM Web Server/Public Access)
resource "azurerm_subnet" "public_subnet" {
  name                 = "Subnet-Publik"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["10.0.1.0/24"]
}

# 5. Membuat Subnet Privat (Untuk Database - Lebih Aman)
resource "azurerm_subnet" "private_subnet" {
  name                 = "Subnet-Privat"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["10.0.2.0/24"]
}

# Membuat Public IP untuk VM 1
resource "azurerm_public_ip" "pip_web" {
  name                = "IP-Publik-Web-Kelompok11"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  
  sku                 = "Standard"  # Tambahkan baris ini
  allocation_method   = "Static"    # Ubah dari Dynamic ke Static
}

# Network Interface untuk VM 1
resource "azurerm_network_interface" "nic_web" {
  name                = "NIC-Web-Kelompok11"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.public_subnet.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.pip_web.id
  }
}

# VM Linux 1 (VM-Web)
resource "azurerm_linux_virtual_machine" "vm_web" {
  name                = "VM-Web-Kelompok11"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  size                = "Standard_B2ats_v2"
  admin_username = var.admin_username
  admin_password = var.admin_password
  disable_password_authentication = false

  network_interface_ids = [azurerm_network_interface.nic_web.id]

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts"
    version   = "latest"
  }
}