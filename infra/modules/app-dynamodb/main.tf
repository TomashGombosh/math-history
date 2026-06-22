locals {
  table_name = "${var.project_name}-ddb-${var.environment}"
  default_tags = merge(
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    },
    var.tags,
  )
}

resource "aws_dynamodb_table" "main" {
  name         = local.table_name
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = var.hash_key_name
  range_key = var.range_key_name

  attribute {
    name = var.hash_key_name
    type = "S"
  }

  attribute {
    name = var.range_key_name
    type = "S"
  }

  dynamic "attribute" {
    for_each = var.enable_gsi1 ? [1] : []
    content {
      name = var.gsi1_hash_key_name
      type = "S"
    }
  }

  dynamic "attribute" {
    for_each = var.enable_gsi1 ? [1] : []
    content {
      name = var.gsi1_range_key_name
      type = "S"
    }
  }

  dynamic "global_secondary_index" {
    for_each = var.enable_gsi1 ? [1] : []
    content {
      name            = var.gsi1_name
      hash_key        = var.gsi1_hash_key_name
      range_key       = var.gsi1_range_key_name
      projection_type = "ALL"
    }
  }

  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  dynamic "ttl" {
    for_each = var.ttl_attribute_name != "" ? [1] : []
    content {
      attribute_name = var.ttl_attribute_name
      enabled        = true
    }
  }

  tags = local.default_tags
}
