output "bucket_name" {
  value       = module.app_s3_data.bucket_name
  description = "Application uploads bucket (math-history-server-data-<stage|prod>)."
}

output "bucket_arn" {
  value       = module.app_s3_data.bucket_arn
  description = "Uploads bucket ARN."
}
