output "distribution_id" {
  description = "Assets CloudFront distribution ID."
  value       = aws_cloudfront_distribution.assets.id
}

output "distribution_arn" {
  description = "Assets CloudFront distribution ARN."
  value       = aws_cloudfront_distribution.assets.arn
}

output "distribution_domain_name" {
  description = "Assets CloudFront domain (*.cloudfront.net)."
  value       = aws_cloudfront_distribution.assets.domain_name
}

output "assets_cloudfront_alias" {
  description = "Configured assets hostname."
  value       = var.assets_cloudfront_alias
}
