variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "subnet_az1_cidr" {
  description = "CIDR block for subnet in AZ1"
  type        = string
  default     = "10.0.1.0/24"
}

variable "subnet_az2_cidr" {
  description = "CIDR block for subnet in AZ2"
  type        = string
  default     = "10.0.2.0/24"
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
