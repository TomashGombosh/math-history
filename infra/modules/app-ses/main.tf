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
  email_identity = var.sender_domain
  tags           = local.default_tags
}

resource "aws_sesv2_email_identity_mail_from_attributes" "mail_from" {
  count = var.enable_mail_from ? 1 : 0

  email_identity         = aws_sesv2_email_identity.domain.email_identity
  mail_from_domain       = local.mail_from_domain
  behavior_on_mx_failure = "USE_DEFAULT_VALUE"
}

locals {
  dkim_tokens = try(aws_sesv2_email_identity.domain.dkim_signing_attributes[0].tokens, [])
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
