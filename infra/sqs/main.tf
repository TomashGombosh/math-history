module "app_sqs" {
  source = "../modules/app-sqs"

  project_name = var.project_name
  environment  = var.environment
}
