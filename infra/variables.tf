variable "admin_username" {
  description = "Username untuk login VM"
  type        = string
  default     = "naufaladmin"
}

variable "admin_password" {
  description = "Password untuk login VM"
  type        = string
  sensitive   = true
}

variable "auth_token_secret" {
  description = "Secret minimal 32 karakter untuk tanda tangan token login"
  type        = string
  sensitive   = true
}

# Principal IDs untuk tim
variable "id_naufal" {
  description = "Principal ID untuk Naufal (Owner)"
  type        = string
}

variable "log_analytics_workspace_id" {
  description = "ID Log Analytics Workspace yang sudah ada di Azure"
  type        = string
}

variable "alert_email" {
  description = "Email penerima notifikasi Azure Monitor alert untuk operasional proyek"
  type        = string
  default     = "kelompok11@example.com"
}

variable "azure_subscription_id" {
  description = "Subscription ID Azure untuk endpoint admin operations mengambil Azure Monitor metrics"
  type        = string
  default     = ""
}

variable "cloudflare_zone_id" {
  description = "Zone ID Cloudflare untuk endpoint admin operations mengambil traffic analytics"
  type        = string
  default     = ""
}

variable "azure_vm_name" {
  description = "Nama VM Azure yang dipantau untuk CPU usage dashboard developer"
  type        = string
  default     = "VM-Web-Kelompok11"
}

variable "backup_app_service_name" {
  description = "Nama global Azure App Service untuk backup backend"
  type        = string
  default     = "app-backend-backup-k11"
}

variable "backup_app_service_sku" {
  description = "SKU App Service Plan untuk backup backend. Gunakan F1 agar low cost, atau B1 jika F1 tidak tersedia."
  type        = string
  default     = "F1"
}

variable "id_rendy" { type = string }
variable "id_arifin" { type = string }
variable "id_zhykwa" { type = string }

variable "admin_ssh_allowed_ip" {
  description = "IP Publik admin untuk mengakses SSH port 22 VM"
  type        = string
  default     = "182.1.2.3/32" 
}
