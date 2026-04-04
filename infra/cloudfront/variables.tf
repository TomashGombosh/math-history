variable "aws_region" {
  type        = string
  description = "AWS region for S3 API calls and data sources (bucket region)."
}

variable "environment" {
  type        = string
  description = "stage (development branch) or prod (main branch)."

  validation {
    condition     = contains(["stage", "prod"], var.environment)
    error_message = "environment must be stage or prod."
  }
}

variable "acm_certificate_arn" {
  type        = string
  description = "ACM certificate ARN in us-east-1 for alternate domain names (CloudFront requirement)."

  validation {
    condition     = can(regex("^arn:aws:acm:us-east-1:[0-9]{12}:certificate/.+", var.acm_certificate_arn))
    error_message = "acm_certificate_arn must be an ACM certificate ARN in us-east-1 (CloudFront requirement)."
  }
}

variable "api_gateway_domain_name" {
  type        = string
  description = "HTTP API invoke hostname only, e.g. abc123.execute-api.eu-north-1.amazonaws.com (no scheme or path)."

  validation {
    condition     = length(trimspace(var.api_gateway_domain_name)) > 0 && !can(regex("^https?://", var.api_gateway_domain_name))
    error_message = "api_gateway_domain_name must be a hostname without http(s)://."
  }
}

variable "cloudfront_alias" {
  type        = string
  description = "Alternate domain for this distribution (e.g. math-history.afj-solution.com or math-history-stage.afj-solution.com)."

  validation {
    condition     = length(trimspace(var.cloudfront_alias)) > 0
    error_message = "cloudfront_alias must be non-empty."
  }
}

variable "s3_bucket_name" {
  type        = string
  default     = ""
  description = "Override static bucket name; leave empty for math-history-client-static-<environment>."
}

variable "s3_data_bucket_name" {
  type        = string
  default     = ""
  description = "Override uploads/data bucket for /images/*; leave empty for math-history-server-data-<environment>."
}
