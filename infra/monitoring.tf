# ================================================================
# 10. MONITORING, ALERTING, AND STORAGE OPTIMIZATION (Minggu 4)
# ================================================================

resource "azurerm_monitor_action_group" "ops" {
  name                = "ag-kelompok11-ops"
  resource_group_name = azurerm_resource_group.rg.name
  short_name          = "k11ops"

  email_receiver {
    name                    = "team-email"
    email_address           = var.alert_email
    use_common_alert_schema = false
  }

  tags = local.common_tags
}

resource "azurerm_monitor_metric_alert" "function_5xx_errors" {
  name                = "alert-function-5xx-errors"
  resource_group_name = azurerm_resource_group.rg.name
  scopes              = [azurerm_linux_function_app.func_app.id]
  description         = "Alert jika Azure Function menghasilkan HTTP 5xx berulang."
  severity            = 2
  frequency           = "PT1M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "Microsoft.Web/sites"
    metric_name      = "Http5xx"
    aggregation      = "Total"
    operator         = "GreaterThan"
    threshold        = 5
  }

  action {
    action_group_id = azurerm_monitor_action_group.ops.id
  }

  tags = local.common_tags
}

resource "azurerm_monitor_metric_alert" "function_latency" {
  name                = "alert-function-latency"
  resource_group_name = azurerm_resource_group.rg.name
  scopes              = [azurerm_linux_function_app.func_app.id]
  description         = "Alert jika rata-rata response time Azure Function lebih dari 2 detik."
  severity            = 3
  frequency           = "PT1M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "Microsoft.Web/sites"
    metric_name      = "AverageResponseTime"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 2
  }

  action {
    action_group_id = azurerm_monitor_action_group.ops.id
  }

  tags = local.common_tags
}

resource "azurerm_monitor_metric_alert" "vm_cpu_high" {
  name                = "alert-vm-cpu-high"
  resource_group_name = azurerm_resource_group.rg.name
  scopes              = [azurerm_linux_virtual_machine.vm_web.id]
  description         = "Alert jika CPU VM rata-rata lebih dari 80 persen."
  severity            = 3
  frequency           = "PT1M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "Microsoft.Compute/virtualMachines"
    metric_name      = "Percentage CPU"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 80
  }

  action {
    action_group_id = azurerm_monitor_action_group.ops.id
  }

  tags = local.common_tags
}

resource "azurerm_storage_management_policy" "raw_data_lifecycle" {
  storage_account_id = azurerm_storage_account.func_storage.id

  rule {
    name    = "raw-data-retention"
    enabled = true

    filters {
      prefix_match = ["raw-data/"]
      blob_types   = ["blockBlob"]
    }

    actions {
      base_blob {
        tier_to_cool_after_days_since_modification_greater_than = 30
        delete_after_days_since_modification_greater_than       = 180
      }
    }
  }
}

resource "azurerm_monitor_diagnostic_setting" "function_central_logs" {
  name                       = "diag-function-central-logs"
  target_resource_id         = azurerm_linux_function_app.func_app.id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category = "FunctionAppLogs"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}

resource "azurerm_monitor_diagnostic_setting" "cosmos_central_logs" {
  name                       = "diag-cosmos-central-logs"
  target_resource_id         = azurerm_cosmosdb_account.cosmos_acc.id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  lifecycle {
    ignore_changes = [
      metric
    ]
  }

  enabled_log {
    category = "DataPlaneRequests"
  }

  enabled_log {
    category = "QueryRuntimeStatistics"
  }

  metric {
    category = "Requests"
    enabled  = true
  }
}

resource "azurerm_monitor_diagnostic_setting" "storage_blob_central_logs" {
  name                       = "diag-storage-blob-central-logs"
  target_resource_id         = "${azurerm_storage_account.func_storage.id}/blobServices/default"
  log_analytics_workspace_id = var.log_analytics_workspace_id

  lifecycle {
    ignore_changes = [
      metric
    ]
  }

  enabled_log {
    category = "StorageRead"
  }

  enabled_log {
    category = "StorageWrite"
  }

  enabled_log {
    category = "StorageDelete"
  }

  metric {
    category = "Transaction"
    enabled  = true
  }
}
