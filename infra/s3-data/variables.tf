variable "aws_region" {
  type        = string
  description = "AWS region for the S3 bucket."
}

variable "project_name" {
  type        = string
  description = "Must match serverless service prefix (e.g. math-history-server)."
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

variable "cors_allowed_origins" {
  type        = list(string)
  description = "Allowed origins for CORS on the uploads bucket (browser presigned PUT)."
  default     = ["*"]
}

variable "tags" {
  type        = map(string)
  description = "Additional tags for the bucket."
  default     = {}
}
