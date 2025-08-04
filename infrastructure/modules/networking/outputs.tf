output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.nrn_vpc.id
}

output "subnet_az1_id" {
  description = "ID of subnet in AZ1"
  value       = aws_subnet.subnet_az1.id
}

output "subnet_az2_id" {
  description = "ID of subnet in AZ2"
  value       = aws_subnet.subnet_az2.id
}

output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb_security_group.id
}

output "ec2_security_group_id" {
  description = "ID of the EC2 security group"
  value       = aws_security_group.ec2_security_group.id
}

output "external_api_security_group_id" {
  description = "ID of the external API security group"
  value       = aws_security_group.external_api_sg.id
}
