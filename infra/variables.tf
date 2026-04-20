variable "admin_username" {
  description = "Username untuk login VM"
  type        = string
  default     = "naufaladmin"
}

variable "admin_password" {
  description = "Password untuk login VM"
  type        = string
  sensitive   = true # Ini penting agar tidak muncul di log terminal
}

# Principal IDs untuk tim
variable "id_rendy" { type = string }
variable "id_arifin" { type = string }
variable "id_zhykwa" { type = string }