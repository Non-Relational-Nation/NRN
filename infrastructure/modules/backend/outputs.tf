output "instance_id" {
  description = "ID of the API EC2 instance"
  value       = aws_instance.nrn_api_ec2_instance.id
}

output "instance_private_ip" {
  description = "Private IP address of the API EC2 instance"
  value       = aws_instance.nrn_api_ec2_instance.private_ip
}

output "target_group_arn" {
  description = "ARN of the API target group"
  value       = aws_lb_target_group.api_tg.arn
}
