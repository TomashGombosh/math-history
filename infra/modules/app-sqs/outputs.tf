output "queue_url" {
  value       = aws_sqs_queue.main.url
  description = "Bulk-import SQS queue URL."
}

output "queue_arn" {
  value       = aws_sqs_queue.main.arn
  description = "Bulk-import SQS queue ARN for IAM policies and event source mappings."
}

output "dlq_url" {
  value       = aws_sqs_queue.dlq.url
  description = "Bulk-import dead-letter queue URL."
}

output "dlq_arn" {
  value       = aws_sqs_queue.dlq.arn
  description = "Bulk-import dead-letter queue ARN."
}
