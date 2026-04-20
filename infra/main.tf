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
  name     = "RG-Kelompok11-Cloud"
  location = "Indonesia Central " # Lokasi terdekat di Singapura
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