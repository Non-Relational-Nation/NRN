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

# Data source to fetch the latest Ubuntu 22.04 LTS AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
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

  # Neo4j HTTP interface (for admin - restrict as needed)
  ingress {
    from_port   = 7474
    to_port     = 7474
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Consider restricting this
  }

  # Neo4j Bolt protocol (for applications)
  ingress {
    from_port   = 7687
    to_port     = 7687
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Consider restricting this
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

# ============================================================================
# COMPUTE (EC2 Instances)
# ============================================================================

# Main API instance with co-located databases
resource "aws_instance" "nrn_api_ec2_instance" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.small" # Upgraded for multiple services
  key_name               = aws_key_pair.api_key.key_name
  subnet_id              = aws_subnet.subnet_az1.id
  vpc_security_group_ids = [aws_security_group.ec2_security_group.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  user_data = base64encode(<<-EOF
    #!/bin/bash
    apt update -y
    
    # Install Node.js 18
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    apt install -y nodejs git unzip
    
    # Install Docker
    apt install -y docker.io
    systemctl start docker
    systemctl enable docker
    usermod -a -G docker ubuntu
    
    # Install AWS CLI v2
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    ./aws/install
    
    # Install MongoDB
    wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    apt update -y
    apt install -y mongodb-org
    systemctl start mongod
    systemctl enable mongod
    
    # Install Redis
    apt install -y redis-server
    systemctl start redis-server
    systemctl enable redis-server
    
    # Install Neo4j
    wget -O - https://debian.neo4j.com/neotechnology.gpg.key | sudo apt-key add -
    echo 'deb https://debian.neo4j.com stable latest' | sudo tee -a /etc/apt/sources.list.d/neo4j.list
    apt update -y
    apt install -y neo4j
    systemctl start neo4j
    systemctl enable neo4j
    
    # Configure services for localhost access
    # MongoDB already configured for localhost by default
    # Redis already configured for localhost by default
    # Neo4j - set initial password
    neo4j-admin set-initial-password neo4jpassword || true
    
    echo "All services installed and configured"
  EOF
  )

  tags = {
    Name        = "${local.project}-api-${local.team_name}-${local.environment}"
    Environment = local.environment
    Team        = local.team_name
  }
}

resource "aws_instance" "nrn_web_ec2_instance" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.micro"
  key_name               = aws_key_pair.web_key.key_name
  subnet_id              = aws_subnet.subnet_az2.id
  vpc_security_group_ids = [aws_security_group.ec2_security_group.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  user_data = base64encode(<<-EOF
    #!/bin/bash
    apt update -y
    
    # Install Node.js 18
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    apt install -y nodejs
    
    # Install Docker
    apt install -y docker.io
    systemctl start docker
    systemctl enable docker
    usermod -a -G docker ubuntu
    
    # Install AWS CLI v2
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    apt install -y unzip
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
    path                = "/api/health"
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

# HTTP Listener (Development - Free load balancer DNS only)
resource "aws_lb_listener" "http_listener" {
  load_balancer_arn = aws_lb.nrn_alb.arn
  port              = "80"
  protocol          = "HTTP"

  # Default action forwards to web frontend for root paths
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web_tg.arn
  }
}

# Web app will be accessible at: http://your-alb-dns/web
resource "aws_lb_listener_rule" "web_path_rule" {
  listener_arn = aws_lb_listener.http_listener.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web_tg.arn
  }

  condition {
    path_pattern {
      values = ["/web*"]
    }
  }
}

# API will be accessible at: http://your-alb-dns/api
resource "aws_lb_listener_rule" "api_path_rule" {
  listener_arn = aws_lb_listener.http_listener.arn
  priority     = 200

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api_tg.arn
  }

  condition {
    path_pattern {
      values = ["/api*"]
    }
  }
}
