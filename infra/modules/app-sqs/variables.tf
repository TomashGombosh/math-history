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

variable "tags" {
  type        = map(string)
  description = "Additional tags for the queues."
  default     = {}
}
