module "app_s3_data" {
  source = "../modules/app-s3-data"

  project_name         = var.project_name
  environment          = var.environment
  cors_allowed_origins = var.cors_allowed_origins
  tags                 = var.tags
}
