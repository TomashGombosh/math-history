variable "project_name" {
  type        = string
  description = "Short project name used in resource naming."
}

variable "hash_key_name" {
  type        = string
  description = "Table partition key (must match app / server migration schema)."
  default     = "pk"
}

variable "range_key_name" {
  type        = string
  description = "Table sort key."
  default     = "sk"
}

variable "gsi1_name" {
  type        = string
  description = "First global secondary index name."
  default     = "GSI1"
}

variable "gsi1_hash_key_name" {
  type        = string
  description = "GSI1 partition attribute name."
  default     = "gsi1pk"
}

variable "gsi1_range_key_name" {
  type        = string
  description = "GSI1 sort attribute name."
  default     = "gsi1sk"
}

variable "enable_gsi1" {
  type        = bool
  description = "Create GSI1 on the table. Set false for tables that only need pk/sk (e.g. bulk-import staging)."
  default     = true
}

variable "environment" {
  type        = string
  description = "Deployment environment label (e.g. stage, prod)."

  validation {
    condition     = contains(["stage", "prod"], var.environment)
    error_message = "environment must be stage or prod."
  }
}

variable "enable_point_in_time_recovery" {
  type        = bool
  description = "Enable DynamoDB PITR (extra cost; recommended for prod)."
  default     = false
}

variable "ttl_attribute_name" {
  type        = string
  description = "DynamoDB TTL attribute name. Leave empty to leave TTL disabled (default for existing tables)."
  default     = ""
}

variable "tags" {
  type        = map(string)
  description = "Additional tags for the table."
  default     = {}
}
