variable "aws_region" {
  type        = string
  description = "AWS region for SES (must support SES; eu-north-1 is used by this project)."
}

variable "project_name" {
  type        = string
  description = "Short project prefix for resource tagging."
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

variable "sender_domain" {
  type        = string
  description = "Domain for SES identity and no-reply sender (e.g. afj-solution.com)."
}

variable "sender_local_part" {
  type        = string
  description = "Local part of the review-notification sender address."
  default     = "no-reply"
}

variable "enable_mail_from" {
  type        = bool
  description = "Enable custom MAIL FROM subdomain for the SES identity."
  default     = false
}

variable "tags" {
  type        = map(string)
  description = "Additional tags passed to the SES module."
  default     = {}
}
