output "table_name" {
  value       = module.app_dynamodb.table_name
  description = "Application DynamoDB table name."
}

output "table_arn" {
  value       = module.app_dynamodb.table_arn
  description = "Application DynamoDB table ARN."
}
