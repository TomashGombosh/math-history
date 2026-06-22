output "sender_address" {
  value       = module.app_ses.sender_address
  description = "Set as SES_SENDER when deploying the Serverless API."
}

output "sender_domain" {
  value       = module.app_ses.sender_domain
  description = "Verified SES domain."
}

output "email_identity_arn" {
  value       = module.app_ses.email_identity_arn
  description = "SES domain identity ARN."
}

output "verified_for_sending_status" {
  value       = module.app_ses.verified_for_sending_status
  description = "Whether SES allows sending from this identity."
}

output "dkim_status" {
  value       = module.app_ses.dkim_status
  description = "DKIM signing status."
}

output "verification_status" {
  value       = module.app_ses.verified_for_sending_status
  description = "Deprecated alias for verified_for_sending_status."
}

output "dkim_dns_records" {
  value       = module.app_ses.dkim_dns_records
  description = "DKIM CNAME records to add in DNS."
}

output "mail_from_dns_records" {
  value       = module.app_ses.mail_from_dns_records
  description = "Optional MAIL FROM DNS records."
}

output "dns_setup_note" {
  value       = module.app_ses.dns_setup_note
  description = "Operator reminder after apply."
}
