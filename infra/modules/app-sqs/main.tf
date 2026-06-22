locals {
  name = "${var.project_name}-bulkimport-${var.environment}"
  default_tags = merge(
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    },
    var.tags,
  )
}

resource "aws_sqs_queue" "dlq" {
  name                      = "${local.name}-dlq"
  message_retention_seconds = 1209600 # 14d
  tags                      = local.default_tags
}

resource "aws_sqs_queue" "main" {
  name                       = local.name
  visibility_timeout_seconds = 180   # ≥ 6× 30s processor Lambda timeout
  message_retention_seconds  = 86400 # 1d
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = 3
  })
  tags = local.default_tags
}
