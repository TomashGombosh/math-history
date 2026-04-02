variable "project_name" {
  type        = string
  description = "Must match serverless service prefix (e.g. math-history-server)."
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
  description = "Origins allowed for browser GET/PUT to objects (presigned uploads). Use specific HTTPS origins in production."
  default     = ["*"]
}

variable "tags" {
  type        = map(string)
  description = "Additional tags for the bucket."
  default     = {}
}
