variable "project_name" {
  type        = string
  description = "Short project prefix for tagging."
}

variable "environment" {
  type        = string
  description = "Deployment environment label (stage or prod)."

  validation {
    condition     = contains(["stage", "prod"], var.environment)
    error_message = "environment must be stage or prod."
  }
}

variable "sender_domain" {
  type        = string
  description = "Domain verified in SES (e.g. afj-solution.com). Used as the From domain for review notification emails."

  validation {
    condition     = length(var.sender_domain) >= 4 && !strcontains(var.sender_domain, " ")
    error_message = "sender_domain must be a non-empty domain name without spaces."
  }
}

variable "sender_local_part" {
  type        = string
  description = "Local part of the sender address (before @)."
  default     = "no-reply"

  validation {
    condition     = can(regex("^[a-z0-9._+-]+$", var.sender_local_part))
    error_message = "sender_local_part must contain only lowercase letters, digits, and . _ + -"
  }
}

variable "enable_mail_from" {
  type        = bool
  description = "When true, configure a custom MAIL FROM subdomain (mail.<sender_domain>) for better deliverability."
  default     = false
}

variable "manage_email_identity" {
  type        = bool
  description = "When true, create the SES domain identity. When false, reference an existing identity (e.g. created in console or another stack)."
  default     = false
}

variable "tags" {
  type        = map(string)
  description = "Additional tags for SES resources."
  default     = {}
}
