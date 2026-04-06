variable "aws_region" {
  type        = string
  description = "AWS region for S3 (data bucket)."
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
  description = "ACM certificate ARN in us-east-1 for assets hostnames."

  validation {
    condition     = can(regex("^arn:aws:acm:us-east-1:[0-9]{12}:certificate/.+", var.acm_certificate_arn))
    error_message = "acm_certificate_arn must be an ACM certificate ARN in us-east-1 (CloudFront requirement)."
  }
}

variable "assets_cloudfront_alias" {
  type        = string
  description = "Alternate domain (e.g. assets-math-stage.afj-solution.com or assets-math.afj-solution.com)."

  validation {
    condition     = length(trimspace(var.assets_cloudfront_alias)) > 0
    error_message = "assets_cloudfront_alias must be non-empty."
  }
}

variable "s3_data_bucket_name" {
  type        = string
  default     = ""
  description = "Uploads bucket; leave empty for math-history-server-data-<environment>."
}
