output "user_pool_id" {
  value       = module.app_cognito.user_pool_id
  description = "Cognito User Pool ID."
}

output "user_pool_client_id" {
  value       = module.app_cognito.user_pool_client_id
  description = "Web app client ID."
}

output "user_pool_arn" {
  value       = module.app_cognito.user_pool_arn
  description = "Cognito User Pool ARN."
}
