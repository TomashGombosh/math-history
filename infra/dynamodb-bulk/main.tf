module "app_dynamodb_bulk" {
  source = "../modules/app-dynamodb"

  project_name                  = var.project_name
  environment                   = var.environment
  ttl_attribute_name            = "ttl"
  enable_gsi1                   = false
  enable_point_in_time_recovery = false
}
