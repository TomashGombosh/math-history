variable "project_name" {
  type        = string
  description = "Short project name used in resource naming."
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

variable "tags" {
  type        = map(string)
  description = "Additional tags for the table."
  default     = {}
}
