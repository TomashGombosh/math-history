variable "aws_region" {
  type        = string
  description = "AWS region for Cognito."
}

variable "project_name" {
  type        = string
  description = "Short project prefix for pool naming."
  default     = "math-history"
}

variable "environment" {
  type        = string
  description = "stage (development branch) or prod (main branch)."

  validation {
    condition     = contains(["stage", "prod"], var.environment)
    error_message = "environment must be stage or prod."
  }
}
