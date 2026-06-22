output "table_name" {
  value       = module.app_dynamodb_bulk.table_name
  description = "Bulk-import DynamoDB table name."
}

output "table_arn" {
  value       = module.app_dynamodb_bulk.table_arn
  description = "Bulk-import DynamoDB table ARN."
}
