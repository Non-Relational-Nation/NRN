terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "nrn-bucket1"
    key    = "terraform/nrn-group01-dev.tfstate" # You can change this path as needed
    region = "af-south-1"
  }
}

provider "aws" {
  region = var.region_name
}

# Data source to fetch the latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]
  
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
  
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Team-specific naming
locals {
  team_name   = "grad-group01"
  environment = "dev"
  project     = "nrn"
}

# Key pairs for EC2 instances
resource "aws_key_pair" "api_key" {
  key_name   = "${local.team_name}-api-key"
  public_key = file("./team-key.pub")  
  
  tags = {
    Name        = "${local.project}-api-key-${local.team_name}-${local.environment}"
    Environment = local.environment
    Team        = local.team_name
  }
}

resource "aws_key_pair" "web_key" {
  key_name   = "${local.team_name}-web-key"
  public_key = file("./team-key.pub")  
  
  tags = {
    Name        = "${local.project}-web-key-${local.team_name}-${local.environment}"
    Environment = local.environment
    Team        = local.team_name
  }
}

resource "aws_key_pair" "mongodb_key" {
  key_name   = "${local.team_name}-mongodb-key"
  public_key = file("./team-key.pub")  
  
  tags = {
    Name        = "${local.project}-mongodb-key-${local.team_name}-${local.environment}"
    Environment = local.environment
    Team        = local.team_name
  }
}

resource "aws_vpc" "nrn_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${local.project}-vpc-${local.team_name}-${local.environment}"
    Environment = local.environment
    Team        = local.team_name
  }
}

# Internet Gateway
resource "aws_internet_gateway" "nrn_igw" {
  vpc_id = aws_vpc.nrn_vpc.id

  tags = {
    Name        = "${local.project}-igw-${local.team_name}-${local.environment}"
    Environment = local.environment
    Team        = local.team_name
  }
}

# Route Table
resource "aws_route_table" "nrn_public_rt" {
  vpc_id = aws_vpc.nrn_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.nrn_igw.id
  }

  tags = {
    Name        = "${local.project}-public-rt-${local.team_name}-${local.environment}"
    Environment = local.environment
    Team        = local.team_name
  }
}

data "aws_availability_zones" "available_zones" {
  state = "available"
}

# Create subnets in different AZs
resource "aws_subnet" "subnet_az1" {
  vpc_id                  = aws_vpc.nrn_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available_zones.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${local.project}-subnet-az1-${local.team_name}-${local.environment}"
    Environment = local.environment
    Team        = local.team_name
  }
}

resource "aws_subnet" "subnet_az2" {
  vpc_id                  = aws_vpc.nrn_vpc.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = data.aws_availability_zones.available_zones.names[1]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${local.project}-subnet-az2-${local.team_name}-${local.environment}"
    Environment = local.environment
    Team        = local.team_name
  }
}

# Associate subnets with route table
resource "aws_route_table_association" "public_rta_az1" {
  subnet_id      = aws_subnet.subnet_az1.id
  route_table_id = aws_route_table.nrn_public_rt.id
}

resource "aws_route_table_association" "public_rta_az2" {
  subnet_id      = aws_subnet.subnet_az2.id
  route_table_id = aws_route_table.nrn_public_rt.id
}

# S3 Bucket for object storage
resource "aws_s3_bucket" "nrn_object_storage" {
  bucket = "${local.project}-${local.team_name}-${local.environment}-${random_string.bucket_suffix.result}"

  tags = {
    Name        = "NrnObjectStorage"
    Environment = local.environment
    Team        = local.team_name
  }
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "aws_s3_bucket_versioning" "nrn_bucket_versioning" {
  bucket = aws_s3_bucket.nrn_object_storage.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "nrn_bucket_encryption" {
  bucket = aws_s3_bucket.nrn_object_storage.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block public access to S3 bucket
resource "aws_s3_bucket_public_access_block" "nrn_bucket_pab" {
  bucket = aws_s3_bucket.nrn_object_storage.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# IAM role for EC2 instances to access S3
resource "aws_iam_role" "ec2_s3_role" {
  name = "nrn_ec2_s3_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "s3_access_policy" {
  name        = "nrn_s3_access_policy"
  description = "Policy for EC2 instances to access S3 bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.nrn_object_storage.arn,
          "${aws_s3_bucket.nrn_object_storage.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "attach_s3_policy" {
  role       = aws_iam_role.ec2_s3_role.name
  policy_arn = aws_iam_policy.s3_access_policy.arn
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "nrn_ec2_profile"
  role = aws_iam_role.ec2_s3_role.name
}

# Security group for EC2 instances (API and Web)
resource "aws_security_group" "ec2_security_group" {
  name_prefix = "nrn_app_sg"
  vpc_id      = aws_vpc.nrn_vpc.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 444
    to_port     = 444
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "nrn_app_security_group"
  }
}

# MongoDB on dedicated EC2 instance 
resource "aws_security_group" "mongodb_security_group" {
  name_prefix = "nrn_mongodb_sg"
  vpc_id      = aws_vpc.nrn_vpc.id

  # MongoDB port - ONLY accessible from app security group (internal access)
  ingress {
    from_port       = 27017
    to_port         = 27017
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_security_group.id]
  }

  # SSH access
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "nrn_mongodb_security_group"
  }
}

resource "aws_instance" "nrn_mongodb_ec2_instance" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro"  
  key_name               = aws_key_pair.mongodb_key.key_name
  subnet_id              = aws_subnet.subnet_az1.id
  vpc_security_group_ids = [aws_security_group.mongodb_security_group.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    
    # Install MongoDB
    cat <<EOT > /etc/yum.repos.d/mongodb-org-7.0.repo
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/amazon/2/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-7.0.asc
EOT
    
    yum install -y mongodb-org
    systemctl start mongod
    systemctl enable mongod
    
    # Configure MongoDB for remote connections (bind to all interfaces)
    sed -i 's/bindIp: 127.0.0.1/bindIp: 0.0.0.0/' /etc/mongod.conf
    systemctl restart mongod
  EOF
  )

  tags = {
    Name        = "${local.project}-mongodb-${local.team_name}-${local.environment}"
    Environment = local.environment
    Team        = local.team_name
  }
}

# Main application instances
resource "aws_instance" "nrn_api_ec2_instance" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro"
  key_name               = aws_key_pair.api_key.key_name
  subnet_id              = aws_subnet.subnet_az1.id
  vpc_security_group_ids = [aws_security_group.ec2_security_group.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
    yum install -y nodejs git
    
    # Install Docker for containerized applications
    yum install -y docker
    systemctl start docker
    systemctl enable docker
    usermod -a -G docker ec2-user
    
    # Install AWS CLI v2
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    yum install -y unzip
    unzip awscliv2.zip
    ./aws/install
    
    # MongoDB will be on separate dedicated instance
    # Connection string: mongodb://MONGODB_HOST:27017/your_database
  EOF
  )

  tags = {
    Name        = "${local.project}-api-${local.team_name}-${local.environment}"
    Environment = local.environment
    Team        = local.team_name
  }
}

resource "aws_instance" "nrn_web_ec2_instance" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro"
  key_name               = aws_key_pair.web_key.key_name
  subnet_id              = aws_subnet.subnet_az2.id
  vpc_security_group_ids = [aws_security_group.ec2_security_group.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    
    # Install Node.js for TypeScript frontend
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
    yum install -y nodejs
    
    # Install Docker
    yum install -y docker
    systemctl start docker
    systemctl enable docker
    usermod -a -G docker ec2-user
    
    # Install AWS CLI v2
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    yum install -y unzip
    unzip awscliv2.zip
    ./aws/install
  EOF
  )

  tags = {
    Name        = "${local.project}-web-${local.team_name}-${local.environment}"
    Environment = local.environment
    Team        = local.team_name
  }
}

# Budget configuration
resource "aws_budgets_budget" "nrn_budget" {
  name              = "nrn_budget"
  budget_type       = "COST"
  limit_amount      = "25"
  limit_unit        = "USD"
  time_period_end   = "2025-08-12_00:00"
  time_period_start = "2025-07-29_00:00"
  time_unit         = "MONTHLY"

  notification {
    comparison_operator        = "EQUAL_TO"
    threshold                  = 50
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = var.budget_notification_emails
  }

  notification {
    comparison_operator        = "EQUAL_TO"
    threshold                  = 75
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = var.budget_notification_emails
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 10
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.budget_notification_emails
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 20
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.budget_notification_emails
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 30
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.budget_notification_emails
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 40
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.budget_notification_emails
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 50
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.budget_notification_emails
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 60
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.budget_notification_emails
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.budget_notification_emails
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 90
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.budget_notification_emails
  }
}

# Note: Outputs are defined in outputs.tf to avoid duplication

# Outputs
output "api_ec2_host" {
  value       = aws_instance.nrn_api_ec2_instance.public_dns
  description = "The DNS endpoint of the API EC2 instance"
}

output "api_ec2_ip" {
  value       = aws_instance.nrn_api_ec2_instance.public_ip
  description = "Public IP of API server"
}

output "web_ec2_host" {
  value       = aws_instance.nrn_web_ec2_instance.public_dns
  description = "The DNS endpoint of the Web EC2 instance"
}

output "web_ec2_ip" {
  value       = aws_instance.nrn_web_ec2_instance.public_ip
  description = "Public IP of Web server"
}

output "mongodb_host" {
  value       = aws_instance.nrn_mongodb_ec2_instance.public_dns
  description = "The DNS endpoint of the MongoDB EC2 instance"
}

output "mongodb_ec2_ip" {
  value       = aws_instance.nrn_mongodb_ec2_instance.public_ip
  description = "Public IP of MongoDB server"
}

output "mongodb_connection_string" {
  value       = "mongodb://${aws_instance.nrn_mongodb_ec2_instance.public_dns}:27017/nrn_db"
  description = "MongoDB connection string for your application"
}

output "summary" {
  value = <<-EOT

  🎉 Infrastructure deployed successfully!

  📝 SAVE THESE DETAILS:

  API Server:     ${aws_instance.nrn_api_ec2_instance.public_dns}
  Web Server:     ${aws_instance.nrn_web_ec2_instance.public_dns}
  MongoDB Server: ${aws_instance.nrn_mongodb_ec2_instance.public_dns}
  S3 Bucket:      ${aws_s3_bucket.nrn_object_storage.bucket}

  🔐 SSH Commands:
  ssh -i team-key ec2-user@${aws_instance.nrn_api_ec2_instance.public_ip}
  ssh -i team-key ec2-user@${aws_instance.nrn_web_ec2_instance.public_ip}
  ssh -i team-key ec2-user@${aws_instance.nrn_mongodb_ec2_instance.public_ip}

  💾 MongoDB Connection:
  mongodb://${aws_instance.nrn_mongodb_ec2_instance.public_dns}:27017/nrn_db

  EOT
}
