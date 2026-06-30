module "app_ses" {
  source = "../modules/app-ses"

  project_name      = var.project_name
  environment       = var.environment
  sender_domain          = var.sender_domain
  sender_local_part      = var.sender_local_part
  enable_mail_from       = var.enable_mail_from
  manage_email_identity  = var.manage_email_identity
  tags                   = var.tags
}
