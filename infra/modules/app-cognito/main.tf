locals {
  pool_name = "${var.project_name}-cognito-${var.environment}"
  default_tags = merge(
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    },
    var.tags,
  )
}

resource "aws_cognito_user_pool" "main" {
  name = local.pool_name

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = false
    require_uppercase                = true
    temporary_password_validity_days = 7
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  tags = local.default_tags
}

resource "aws_cognito_user_group" "admin" {
  name         = var.admin_group_name
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Administrators"
}

resource "aws_cognito_user_pool_client" "web" {
  name         = "${local.pool_name}-web"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret                      = false
  allowed_oauth_flows_user_pool_client = false

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]

  prevent_user_existence_errors = "ENABLED"
}
