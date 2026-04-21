terraform {
  backend "azurerm" {
    resource_group_name  = "RG-Kelompok11"
    storage_account_name = "stbackendk11naufal"
    container_name       = "tfstate"
    key                  = "terraform.tfstate"
  }
}
