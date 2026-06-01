locals {
  data_bucket_name = trimspace(var.s3_data_bucket_name) != "" ? trimspace(var.s3_data_bucket_name) : "math-history-server-data-${var.environment}"
}

data "aws_s3_bucket" "data" {
  bucket = local.data_bucket_name
}

data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_origin_request_policy" "cors_s3" {
  name = "Managed-CORS-S3Origin"
}

resource "aws_cloudfront_origin_access_control" "data" {
  name                              = "math-history-assets-${var.environment}"
  description                       = "OAC for ${local.data_bucket_name} (assets CDN)"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "assets" {
  enabled         = true
  is_ipv6_enabled = true
  comment         = "math-history assets ${var.environment}"
  price_class     = "PriceClass_100"
  aliases         = [var.assets_cloudfront_alias]

  origin {
    origin_id                = "s3-data"
    domain_name              = data.aws_s3_bucket.data.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.data.id
  }

  default_cache_behavior {
    target_origin_id       = "s3-data"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_optimized.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.cors_s3.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = var.acm_certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}

resource "aws_s3_bucket_policy" "cloudfront_oac_assets" {
  bucket = data.aws_s3_bucket.data.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontAssetsOACRead"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${data.aws_s3_bucket.data.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.assets.arn
          }
        }
      }
    ]
  })
}
