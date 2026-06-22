output "sender_address" {
  value       = local.sender_address
  description = "SES From address for POST /api/reviews (set as SES_SENDER on the Serverless API)."
}

output "sender_domain" {
  value       = var.sender_domain
  description = "Verified SES domain."
}

output "email_identity_arn" {
  value       = aws_sesv2_email_identity.domain.arn
  description = "ARN of the SES domain identity."
}

output "verified_for_sending_status" {
  value       = aws_sesv2_email_identity.domain.verified_for_sending_status
  description = "True when SES can send from this identity (after DNS verification and any sandbox rules)."
}

output "dkim_status" {
  value       = try(aws_sesv2_email_identity.domain.dkim_signing_attributes[0].status, null)
  description = "DKIM signing status for the domain identity."
}

output "dkim_dns_records" {
  value       = local.dkim_dns_records
  description = "CNAME records to publish for Easy DKIM (required for deliverability)."
}

output "mail_from_dns_records" {
  value       = local.mail_from_dns_records
  description = "MX/TXT records for custom MAIL FROM when enable_mail_from is true."
}

output "dns_setup_note" {
  value       = "Publish dkim_dns_records (and mail_from_dns_records if enabled) in your DNS provider, then confirm verified_for_sending_status is true. Until SES production access is granted, recipients must be verified addresses."
  description = "Post-apply steps for operators."
}
