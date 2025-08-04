variable "instance_type" {
  description = "EC2 instance type for web server"
  type        = string
  default     = "t3.micro"
}

variable "key_name" {
  description = "Name of the AWS key pair to use for SSH access"
  type        = string
}

variable "subnet_id" {
  description = "ID of the subnet to launch the instance in"
  type        = string
}

variable "security_group_id" {
  description = "ID of the security group to associate with the instance"
  type        = string
}

variable "iam_instance_profile" {
  description = "Name of the IAM instance profile to associate with the instance"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "project" {
  description = "Project name"
  type        = string
}

variable "team_name" {
  description = "Team name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}
