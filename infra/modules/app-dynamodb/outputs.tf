output "table_name" {
  value       = aws_dynamodb_table.main.name
  description = "DynamoDB table name (set DYNAMODB_TABLE_NAME in the app)."
}

output "table_arn" {
  value       = aws_dynamodb_table.main.arn
  description = "Table ARN for IAM policies."
}
