# ============================================================================
# MAIN TERRAFORM CONFIGURATION - USING MODULES
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
# LOCALS
# ============================================================================

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

resource "aws_s3_bucket_ownership_controls" "nrn_bucket_ownership_controls" {
  bucket = aws_s3_bucket.nrn_object_storage.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_public_access_block" "nrn_bucket_pab" {
  bucket = aws_s3_bucket.nrn_object_storage.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "nrn_bucket_policy" {
  bucket = aws_s3_bucket.nrn_object_storage.id
  depends_on = [
    aws_s3_bucket_public_access_block.nrn_bucket_pab,
    aws_s3_bucket_ownership_controls.nrn_bucket_ownership_controls
  ]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.nrn_object_storage.arn}/*"
      }
    ]
  })
}

# CORS configuration for S3 bucket
resource "aws_s3_bucket_cors_configuration" "nrn_bucket_cors" {
  bucket = aws_s3_bucket.nrn_object_storage.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = [
      "https://dikiudmyn4guv.cloudfront.net",
      "http://localhost:5173",
      "http://localhost:3000"
    ]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
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
          "s3:PutObjectAcl",
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
# NETWORKING MODULE
# ============================================================================

module "networking" {
  source = "./modules/networking"
  
  project     = local.project
  team_name   = local.team_name
  environment = local.environment
}

# ============================================================================
# BACKEND MODULE
# ============================================================================

module "backend" {
  source = "./modules/backend"
  
  key_name               = aws_key_pair.api_key.key_name
  subnet_id              = module.networking.subnet_az1_id
  security_group_id      = module.networking.ec2_security_group_id
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name
  vpc_id                 = module.networking.vpc_id
  google_client_id       = var.google_client_id
  google_client_secret   = var.google_client_secret
  aws_region            = var.region_name
  s3_bucket_name        = aws_s3_bucket.nrn_object_storage.bucket
  project               = local.project
  team_name             = local.team_name
  environment           = local.environment
}

# ============================================================================
# FRONTEND MODULE
# ============================================================================

module "frontend" {
  source = "./modules/frontend"
  
  key_name               = aws_key_pair.web_key.key_name
  subnet_id              = module.networking.subnet_az2_id
  security_group_id      = module.networking.ec2_security_group_id
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name
  vpc_id                 = module.networking.vpc_id
  project               = local.project
  team_name             = local.team_name
  environment           = local.environment
}

# ============================================================================
# APPLICATION LOAD BALANCER
# ============================================================================

resource "aws_lb" "nrn_alb" {
  name               = "${local.project}-alb-${local.team_name}-${local.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [module.networking.alb_security_group_id]
  subnets            = [module.networking.subnet_az1_id, module.networking.subnet_az2_id]

  enable_deletion_protection = false

  tags = {
    Name        = "${local.project}-alb-${local.team_name}-${local.environment}"
    Environment = local.environment
    Team        = local.team_name
  }
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
        arn = module.frontend.target_group_arn
      }
    }
  }
}

# WebFinger and ActivityPub well-known endpoints - route to backend API
resource "aws_lb_listener_rule" "well_known_path_rule" {
  listener_arn = aws_lb_listener.http_listener.arn
  priority     = 50  # Higher priority than other rules

  action {
    type = "forward"
    forward {
      target_group {
        arn = module.backend.target_group_arn
      }
    }
  }

  condition {
    path_pattern {
      values = ["/.well-known*"]
    }
  }
}

# ActivityPub user profiles - route to backend API
resource "aws_lb_listener_rule" "users_path_rule" {
  listener_arn = aws_lb_listener.http_listener.arn
  priority     = 60  # Higher priority than other rules

  action {
    type = "forward"
    forward {
      target_group {
        arn = module.backend.target_group_arn
      }
    }
  }

  condition {
    path_pattern {
      values = ["/users*"]
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
        arn = module.frontend.target_group_arn
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
        arn = module.backend.target_group_arn
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

  # WebFinger and ActivityPub well-known endpoints - route to API without /api prefix
  ordered_cache_behavior {
    path_pattern           = "/.well-known/*"
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

  # WebFinger and ActivityPub well-known endpoints - route to API without /api prefix
  ordered_cache_behavior {
    path_pattern           = "/users/*"
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
        --targets "Key=instanceids,Values=${module.backend.instance_id}" \
        --region ${var.region_name}
      
      # Update web server environment  
      aws ssm send-command \
        --document-name "AWS-RunShellScript" \
        --parameters 'commands=["sudo sed -i \"s/CLOUDFRONT_DOMAIN_PLACEHOLDER/${self.domain_name}/g\" /home/ubuntu/app/frontend/.env.production && cd /home/ubuntu/app/frontend && sudo -u ubuntu npm run build && sudo cp -r dist/* /var/www/html/ && sudo systemctl restart nginx"]' \
        --targets "Key=instanceids,Values=${module.frontend.instance_id}" \
        --region ${var.region_name}
    EOT
  }
}

# ============================================================================
# BUDGET CONFIGURATION
# ============================================================================

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

  tags = {
    Name        = "${local.project}-budget-${local.team_name}-${local.environment}"
    Environment = local.environment
    Team        = local.team_name
  }
}

