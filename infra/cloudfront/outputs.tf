output "distribution_id" {
  description = "CloudFront distribution ID (for cache invalidation, Route 53 alias target)."
  value       = aws_cloudfront_distribution.site.id
}

output "distribution_arn" {
  description = "CloudFront distribution ARN."
  value       = aws_cloudfront_distribution.site.arn
}

output "distribution_domain_name" {
  description = "CloudFront domain name (*.cloudfront.net)."
  value       = aws_cloudfront_distribution.site.domain_name
}

output "cloudfront_alias" {
  description = "Configured alternate domain name."
  value       = var.cloudfront_alias
}
