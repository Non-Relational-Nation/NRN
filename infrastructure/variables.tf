variable "region_name" {
  description = "AWS region name"
  type        = string
  default     = "af-south-1"
}

variable "budget_notification_emails" {
  description = "List of email addresses for budget notifications"
  type        = list(string)
  default     = ["dev-grad-group01-aws@bbd.co.za"]
}