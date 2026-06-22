output "queue_url" {
  value       = module.app_sqs.queue_url
  description = "Bulk-import SQS queue URL."
}

output "queue_arn" {
  value       = module.app_sqs.queue_arn
  description = "Bulk-import SQS queue ARN."
}

output "dlq_url" {
  value       = module.app_sqs.dlq_url
  description = "Bulk-import dead-letter queue URL."
}

output "dlq_arn" {
  value       = module.app_sqs.dlq_arn
  description = "Bulk-import dead-letter queue ARN."
}
