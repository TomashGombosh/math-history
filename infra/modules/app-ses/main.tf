locals {
  sender_address   = "${var.sender_local_part}@${var.sender_domain}"
  mail_from_domain = var.enable_mail_from ? "mail.${var.sender_domain}" : null
  default_tags = merge(
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Purpose     = "review-notifications"
    },
    var.tags,
  )
}

resource "aws_sesv2_email_identity" "domain" {
  count = var.manage_email_identity ? 1 : 0

  email_identity = var.sender_domain
  tags           = local.default_tags
}

data "aws_sesv2_email_identity" "existing" {
  count = var.manage_email_identity ? 0 : 1

  email_identity = var.sender_domain
}

locals {
  identity_arn                     = var.manage_email_identity ? aws_sesv2_email_identity.domain[0].arn : data.aws_sesv2_email_identity.existing[0].arn
  identity_verified_for_sending    = var.manage_email_identity ? aws_sesv2_email_identity.domain[0].verified_for_sending_status : data.aws_sesv2_email_identity.existing[0].verified_for_sending_status
  identity_dkim_signing_attributes = var.manage_email_identity ? aws_sesv2_email_identity.domain[0].dkim_signing_attributes : data.aws_sesv2_email_identity.existing[0].dkim_signing_attributes
}

resource "aws_sesv2_email_identity_mail_from_attributes" "mail_from" {
  count = var.enable_mail_from ? 1 : 0

  email_identity         = var.sender_domain
  mail_from_domain       = local.mail_from_domain
  behavior_on_mx_failure = "USE_DEFAULT_VALUE"
}

locals {
  dkim_tokens = try(local.identity_dkim_signing_attributes[0].tokens, [])
  dkim_dns_records = [
    for token in local.dkim_tokens : {
      name  = "${token}._domainkey.${var.sender_domain}"
      type  = "CNAME"
      value = "${token}.dkim.amazonses.com"
    }
  ]
  mail_from_dns_records = var.enable_mail_from ? [
    {
      name  = local.mail_from_domain
      type  = "MX"
      value = "10 feedback-smtp.${data.aws_region.current.name}.amazonses.com"
    },
    {
      name  = local.mail_from_domain
      type  = "TXT"
      value = "v=spf1 include:amazonses.com ~all"
    },
  ] : []
}

data "aws_region" "current" {}
