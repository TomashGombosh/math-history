variable "aws_region" {
  type        = string
  description = "AWS region for the DynamoDB table."
}

variable "project_name" {
  type        = string
  description = "Must match app naming (e.g. math-history-server for Serverless table prefix)."
  default     = "math-history-server"
}

variable "environment" {
  type        = string
  description = "stage (development branch) or prod (main branch)."

  validation {
    condition     = contains(["stage", "prod"], var.environment)
    error_message = "environment must be stage or prod."
  }
}
