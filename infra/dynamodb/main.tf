module "app_dynamodb" {
  source = "../modules/app-dynamodb"

  project_name                  = var.project_name
  environment                   = var.environment
  enable_point_in_time_recovery = var.environment == "prod"
}
