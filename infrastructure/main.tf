# ============================================================================
# TERRAFORM CONFIGURATION
# ============================================================================

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
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

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] 

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

locals {
  team_name   = "grad-group01"
  environment = "dev"
  project     = "nrn"
}

# ============================================================================
# SSH KEY PAIRS
# ============================================================================

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

resource "aws_internet_gateway" "nrn_igw" {
  vpc_id = aws_vpc.nrn_vpc.id

  tags = {
    Name        = "${local.project}-igw-${local.team_name}-${local.environment}"
    Environment = local.environment
    Team        = local.team_name
  }
}

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

resource "aws_iam_policy" "ssm_access_policy" {
  name        = "nrn_ssm_access_policy"
  description = "Policy for EC2 instances to use SSM"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:UpdateInstanceInformation",
          "ssm:SendCommand",
          "ssm:ListCommandInvocations",
          "ssm:DescribeInstanceInformation",
          "ssm:GetCommandInvocation",
          "ec2messages:*"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "attach_s3_policy" {
  role       = aws_iam_role.ec2_s3_role.name
  policy_arn = aws_iam_policy.s3_access_policy.arn
}

resource "aws_iam_role_policy_attachment" "attach_ssm_policy" {
  role       = aws_iam_role.ec2_s3_role.name
  policy_arn = aws_iam_policy.ssm_access_policy.arn
}

resource "aws_iam_role_policy_attachment" "attach_ssm_managed_policy" {
  role       = aws_iam_role.ec2_s3_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "nrn_ec2_profile"
  role = aws_iam_role.ec2_s3_role.name
}

# ============================================================================
# SECURITY GROUPS
# ============================================================================

resource "aws_security_group" "external_api_sg" {
  name_prefix = "nrn_external_api_sg"
  vpc_id      = aws_vpc.nrn_vpc.id
  description = "Allow trusted external servers to communicate with our API"

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "nrn_external_api_security_group"
  }
}

resource "aws_security_group" "alb_security_group" {
  name_prefix = "nrn_alb_sg"
  vpc_id      = aws_vpc.nrn_vpc.id

  # HTTP access (from CloudFront)
  ingress {
    from_port   = 80
    to_port     = 80
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
    from_port       = 3001
    to_port         = 3001
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_security_group.id]
  }

  ingress {
    from_port       = 5000
    to_port         = 5000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_security_group.id]
  }

  # Neo4j HTTP interface (restricted to ALB only for admin access via web)
  ingress {
    from_port       = 7474
    to_port         = 7474
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_security_group.id]
  }

  # Neo4j Bolt protocol (restricted to ALB for secure application connections)
  ingress {
    from_port       = 7687
    to_port         = 7687
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_security_group.id]
  }

  # Allow API servers to communicate with each other within the same security group
  ingress {
    from_port = 0
    to_port   = 65535
    protocol  = "tcp"
    self      = true
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
  instance_type          = "t3.small" 
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
    
    # Install MongoDB with better error handling
    echo "Installing MongoDB..."
    wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    apt update -y
    apt install -y mongodb-org
    
    # Start and enable MongoDB with verification
    systemctl daemon-reload
    systemctl enable mongod
    systemctl start mongod
    
    # Wait for MongoDB to start and verify it's running
    sleep 10
    if ! systemctl is-active --quiet mongod; then
        echo "MongoDB failed to start, trying alternative approach..."
        systemctl restart mongod
        sleep 10
    fi
    
    # Final verification
    if systemctl is-active --quiet mongod; then
        echo "MongoDB is running successfully"
    else
        echo "MongoDB installation failed"
        journalctl -u mongod --no-pager -n 20
    fi
    
    # Install Redis with verification
    echo "Installing Redis..."
    apt install -y redis-server
    systemctl enable redis-server
    systemctl start redis-server
    
    # Verify Redis is running
    sleep 5
    if systemctl is-active --quiet redis-server; then
        echo "Redis is running successfully"
    else
        echo "Redis installation failed"
        journalctl -u redis-server --no-pager -n 20
    fi
    
    # Install Neo4j with verification
    echo "Installing Neo4j..."
    wget -O - https://debian.neo4j.com/neotechnology.gpg.key | sudo apt-key add -
    echo 'deb https://debian.neo4j.com stable latest' | sudo tee -a /etc/apt/sources.list.d/neo4j.list
    apt update -y
    apt install -y neo4j
    
    # Configure Neo4j initial password
    neo4j-admin set-initial-password neo4jpassword || true
    
    # Start and enable Neo4j
    systemctl enable neo4j
    systemctl start neo4j
    
    # Verify Neo4j is running
    sleep 10
    if systemctl is-active --quiet neo4j; then
        echo "Neo4j is running successfully"
    else
        echo "Neo4j installation failed"
        journalctl -u neo4j --no-pager -n 20
    fi
    
    # Create application directory
    mkdir -p /home/ubuntu/app
    chown ubuntu:ubuntu /home/ubuntu/app
    
    # Create .env file with production environment variables
    cat > /home/ubuntu/app/.env << 'EOL'
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
FRONTEND_URL=https://CLOUDFRONT_DOMAIN_PLACEHOLDER
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_DATABASE=nrn_db
MONGODB_USERNAME=
MONGODB_PASSWORD=
MONGODB_URI=
AWS_REGION=af-south-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=nrn-media
FEDERATION_ENABLED=false
FEDERATION_DOMAIN=CLOUDFRONT_DOMAIN_PLACEHOLDER
FEDERATION_PUBLIC_KEY=
FEDERATION_PRIVATE_KEY=
FEDERATION_USER_AGENT=NRN/1.0.0
GOOGLE_CLIENT_ID=${var.google_client_id}
GOOGLE_CLIENT_SECRET=${var.google_client_secret}
GOOGLE_REDIRECT_URL=https://CLOUDFRONT_DOMAIN_PLACEHOLDER/login/callback
EOL
    
    chown ubuntu:ubuntu /home/ubuntu/app/.env
    
    # Clone your repository (you'll need to replace with your actual repo)
    cd /home/ubuntu/app
    sudo -u ubuntu git clone https://github.com/Non-Relational-Nation/NRN.git .
    
    # Install dependencies and build backend
    cd /home/ubuntu/app/backend
    sudo -u ubuntu npm install
    sudo -u ubuntu npm run build
    
    # Check if build was successful
    if [ ! -f "dist/server.js" ]; then
        echo "Backend build failed - dist/server.js not found"
        exit 1
    fi
    
    # Create systemd service for the backend with better error handling
    cat > /etc/systemd/system/nrn-backend.service << 'EOL'
[Unit]
Description=NRN Backend Service
After=network.target mongod.service redis-server.service neo4j.service
Wants=mongod.service redis-server.service neo4j.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/app/backend
Environment=NODE_ENV=production
EnvironmentFile=/home/ubuntu/app/.env
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOL
    
    # Enable and start the service with database connectivity check
    systemctl daemon-reload
    systemctl enable nrn-backend
    
    # Test database connectivity before starting the service
    echo "Testing database connectivity..."
    
    # Test MongoDB
    if mongosh --eval "db.runCommand('ping')" >/dev/null 2>&1; then
        echo "MongoDB connection successful"
    else
        echo "MongoDB connection failed - checking status..."
        systemctl status mongod --no-pager
    fi
    
    # Test Redis
    if redis-cli ping >/dev/null 2>&1; then
        echo "Redis connection successful"  
    else
        echo "Redis connection failed - checking status..."
        systemctl status redis-server --no-pager
    fi
    
    # Start the backend service
    systemctl start nrn-backend
    
    # Wait a moment and check if service started successfully
    sleep 5
    if ! systemctl is-active --quiet nrn-backend; then
        echo "Backend service failed to start"
        journalctl -u nrn-backend --no-pager
        exit 1
    fi
    
    # Wait for CloudFront distribution to be created and get domain name
    # This will be updated by a post-deployment script
    
    echo "Backend service configured - waiting for CloudFront domain update"
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
    
    # Install nginx for serving frontend
    apt install -y nginx
    
    # Create application directory
    mkdir -p /home/ubuntu/app
    chown ubuntu:ubuntu /home/ubuntu/app
    
    # Clone your repository
    cd /home/ubuntu/app
    sudo -u ubuntu git clone https://github.com/Non-Relational-Nation/NRN.git .
    
    # Build and deploy frontend
    cd /home/ubuntu/app/frontend
    sudo -u ubuntu npm install
    
    # Create environment file for frontend build
    cat > /home/ubuntu/app/frontend/.env.production << 'EOL'
VITE_API_URL=https://CLOUDFRONT_DOMAIN_PLACEHOLDER/api
EOL
    
    sudo -u ubuntu npm run build
    
    # Copy built frontend to nginx directory
    rm -rf /var/www/html/*
    cp -r /home/ubuntu/app/frontend/dist/* /var/www/html/
    
    # Configure nginx
    cat > /etc/nginx/sites-available/default << 'EOL'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    root /var/www/html;
    index index.html;
    
    server_name _;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        return 404;
    }
}
EOL
    
    # Start nginx
    systemctl restart nginx
    systemctl enable nginx
  EOF
  )

  tags = {
    Name        = "${local.project}-web-${local.team_name}-${local.environment}"
    Environment = local.environment
    Team        = local.team_name
  }
}

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

resource "aws_lb_target_group" "api_tg" {
  name     = "${local.project}-api-tg-${local.team_name}-${local.environment}"
  port     = 3001
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

resource "aws_lb_target_group" "web_tg" {
  name     = "${local.project}-web-tg-${local.team_name}-${local.environment}"
  port     = 80
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

resource "aws_lb_target_group_attachment" "api_attachment" {
  target_group_arn = aws_lb_target_group.api_tg.arn
  target_id        = aws_instance.nrn_api_ec2_instance.id
  port             = 3001
}

resource "aws_lb_target_group_attachment" "web_attachment" {
  target_group_arn = aws_lb_target_group.web_tg.arn
  target_id        = aws_instance.nrn_web_ec2_instance.id
  port             = 80
}

# HTTP Listener - Direct traffic routing
resource "aws_lb_listener" "http_listener" {
  load_balancer_arn = aws_lb.nrn_alb.arn
  port              = "80"
  protocol          = "HTTP"

  # Default action forwards to web frontend for root paths
  default_action {
    type = "forward"
    forward {
      target_group {
        arn = aws_lb_target_group.web_tg.arn
      }
    }
  }
}

# Web app will be accessible at: http://your-domain.com/web
resource "aws_lb_listener_rule" "web_path_rule" {
  listener_arn = aws_lb_listener.http_listener.arn
  priority     = 100

  action {
    type = "forward"
    forward {
      target_group {
        arn = aws_lb_target_group.web_tg.arn
      }
    }
  }

  condition {
    path_pattern {
      values = ["/web*"]
    }
  }
}

# API will be accessible at: http://your-domain.com/api
resource "aws_lb_listener_rule" "api_path_rule" {
  listener_arn = aws_lb_listener.http_listener.arn
  priority     = 200

  action {
    type = "forward"
    forward {
      target_group {
        arn = aws_lb_target_group.api_tg.arn
      }
    }
  }

  condition {
    path_pattern {
      values = ["/api*"]
    }
  }
}

# ============================================================================
# CLOUDFRONT (HTTPS with automatic SSL certificate)
# ============================================================================

resource "aws_cloudfront_distribution" "nrn_distribution" {
  origin {
    domain_name = aws_lb.nrn_alb.dns_name
    origin_id   = "ALB-${aws_lb.nrn_alb.name}"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  # Default cache behavior for web content
  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "ALB-${aws_lb.nrn_alb.name}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = true
      headers      = ["*"]
      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  # API cache behavior - no caching for API calls
  ordered_cache_behavior {
    path_pattern           = "/api/*"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "ALB-${aws_lb.nrn_alb.name}"
    compress               = false
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = true
      headers      = ["*"]
      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # CloudFront automatically provides SSL certificate
  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name        = "${local.project}-cloudfront-${local.team_name}-${local.environment}"
    Environment = local.environment
    Team        = local.team_name
  }

  # Update environment variables on EC2 instances after CloudFront is created
  provisioner "local-exec" {
    command = <<-EOT
      # Update API server environment
      aws ssm send-command \
        --document-name "AWS-RunShellScript" \
        --parameters 'commands=["sudo sed -i \"s/CLOUDFRONT_DOMAIN_PLACEHOLDER/${self.domain_name}/g\" /home/ubuntu/app/.env && sudo systemctl restart nrn-backend"]' \
        --targets "Key=instanceids,Values=${aws_instance.nrn_api_ec2_instance.id}" \
        --region ${var.region_name}
      
      # Update web server environment  
      aws ssm send-command \
        --document-name "AWS-RunShellScript" \
        --parameters 'commands=["sudo sed -i \"s/CLOUDFRONT_DOMAIN_PLACEHOLDER/${self.domain_name}/g\" /home/ubuntu/app/frontend/.env.production && cd /home/ubuntu/app/frontend && sudo -u ubuntu npm run build && sudo cp -r dist/* /var/www/html/ && sudo systemctl restart nginx"]' \
        --targets "Key=instanceids,Values=${aws_instance.nrn_web_ec2_instance.id}" \
        --region ${var.region_name}
    EOT
  }
}
