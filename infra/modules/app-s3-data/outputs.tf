output "bucket_name" {
  value       = aws_s3_bucket.data.bucket
  description = "S3 bucket for app uploads (set S3_DATA_BUCKET in Serverless / Lambda)."
}

output "bucket_arn" {
  value       = aws_s3_bucket.data.arn
  description = "Bucket ARN for IAM policies."
}

output "bucket_id" {
  value       = aws_s3_bucket.data.id
  description = "Bucket name (same as bucket_name)."
}
