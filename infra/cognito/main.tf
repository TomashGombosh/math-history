module "app_cognito" {
  source = "../modules/app-cognito"

  project_name = var.project_name
  environment  = var.environment
}
