output "user_pool_id" {
  value       = aws_cognito_user_pool.main.id
  description = "Cognito User Pool ID."
}

output "user_pool_arn" {
  value       = aws_cognito_user_pool.main.arn
  description = "Cognito User Pool ARN."
}

output "user_pool_client_id" {
  value       = aws_cognito_user_pool_client.web.id
  description = "App client ID for SPA / public clients."
}
