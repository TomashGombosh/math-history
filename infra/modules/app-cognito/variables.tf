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

variable "admin_group_name" {
  type        = string
  description = "Cognito group name for administrators (matches cognito:groups checks)."
  default     = "admin"
}

variable "tags" {
  type        = map(string)
  description = "Additional tags for Cognito resources."
  default     = {}
}
