# ============================================================================
# TERRAFORM CONFIGURATION
# ============================================================================

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "nrn-bucket1"
    key    = "terraform/nrn-group01-dev.tfstate" 
    region = "af-south-1"
  }
}

provider "aws" {
  region = var.region_name
}

# ============================================================================
# DATA SOURCES & LOCALS
# ============================================================================

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

data "aws_availability_zones" "available_zones" {
  state = "available"
}

# Team-specific naming
locals {
  team_name   = "grad-group01"
  environment = "dev"
  project     = "nrn"
}

# ============================================================================
# SSH KEY PAIRS
# ============================================================================

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

# ============================================================================
# NETWORKING (VPC, Subnets, Internet Gateway, Routing)
# ============================================================================

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

# ============================================================================
# STORAGE (S3 Bucket Configuration)
# ============================================================================

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

# ============================================================================
# IAM (Roles, Policies, Instance Profiles)
# ============================================================================

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

# ============================================================================
# SECURITY GROUPS
# ============================================================================

# Security group for Application Load Balancer
resource "aws_security_group" "alb_security_group" {
  name_prefix = "nrn_alb_sg"
  vpc_id      = aws_vpc.nrn_vpc.id

  # HTTP access
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS access
  ingress {
    from_port   = 443
    to_port     = 443
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
    Name = "nrn_alb_security_group"
  }
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
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_security_group.id]
  }

  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_security_group.id]
  }

  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_security_group.id]
  }

  ingress {
    from_port       = 5000
    to_port         = 5000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_security_group.id]
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

# ============================================================================
# COMPUTE (EC2 Instances)
# ============================================================================

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

# ============================================================================
# SSL CERTIFICATE & LOAD BALANCER
# ============================================================================

# SSL Certificate for HTTPS
resource "aws_acm_certificate" "nrn_cert" {
  domain_name       = "*.nrn.com"
  validation_method = "DNS"

  subject_alternative_names = [
    "nrn.com"
  ]

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "${local.project}-cert-${local.team_name}-${local.environment}"
    Environment = local.environment
    Team        = local.team_name
  }
}

# Application Load Balancer
resource "aws_lb" "nrn_alb" {
  name               = "${local.project}-alb-${local.team_name}-${local.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_security_group.id]
  subnets            = [aws_subnet.subnet_az1.id, aws_subnet.subnet_az2.id]

  enable_deletion_protection = false

  tags = {
    Name        = "${local.project}-alb-${local.team_name}-${local.environment}"
    Environment = local.environment
    Team        = local.team_name
  }
}

# Target Group for API
resource "aws_lb_target_group" "api_tg" {
  name     = "${local.project}-api-tg-${local.team_name}-${local.environment}"
  port     = 5000
  protocol = "HTTP"
  vpc_id   = aws_vpc.nrn_vpc.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = {
    Name        = "${local.project}-api-tg-${local.team_name}-${local.environment}"
    Environment = local.environment
    Team        = local.team_name
  }
}

# Target Group for Web
resource "aws_lb_target_group" "web_tg" {
  name     = "${local.project}-web-tg-${local.team_name}-${local.environment}"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = aws_vpc.nrn_vpc.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = {
    Name        = "${local.project}-web-tg-${local.team_name}-${local.environment}"
    Environment = local.environment
    Team        = local.team_name
  }
}

# Target Group Attachments
resource "aws_lb_target_group_attachment" "api_attachment" {
  target_group_arn = aws_lb_target_group.api_tg.arn
  target_id        = aws_instance.nrn_api_ec2_instance.id
  port             = 5000
}

resource "aws_lb_target_group_attachment" "web_attachment" {
  target_group_arn = aws_lb_target_group.web_tg.arn
  target_id        = aws_instance.nrn_web_ec2_instance.id
  port             = 3000
}

# HTTP Listener (redirects to HTTPS)
resource "aws_lb_listener" "http_listener" {
  load_balancer_arn = aws_lb.nrn_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# HTTPS Listener for API
resource "aws_lb_listener" "https_api_listener" {
  load_balancer_arn = aws_lb.nrn_alb.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate.nrn_cert.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api_tg.arn
  }
}

# Listener Rule for Web
resource "aws_lb_listener_rule" "web_rule" {
  listener_arn = aws_lb_listener.https_api_listener.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web_tg.arn
  }

  condition {
    host_header {
      values = ["web.nrn.com"]
    }
  }
}
