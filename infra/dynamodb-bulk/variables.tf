variable "aws_region" {
  type        = string
  description = "AWS region for the DynamoDB table."
}

variable "project_name" {
  type        = string
  description = "Must match app naming (e.g. math-history-server-bulkimport for bulk-import staging table)."
  default     = "math-history-server-bulkimport"
}

variable "environment" {
  type        = string
  description = "stage (development branch) or prod (main branch)."

  validation {
    condition     = contains(["stage", "prod"], var.environment)
    error_message = "environment must be stage or prod."
  }
}
