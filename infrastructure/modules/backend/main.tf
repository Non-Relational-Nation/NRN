# ============================================================================
# BACKEND MODULE - API Server, Databases, Load Balancer Target Group
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

# API EC2 Instance with co-located databases
resource "aws_instance" "nrn_api_ec2_instance" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = var.key_name
  subnet_id              = var.subnet_id
  vpc_security_group_ids = [var.security_group_id]
  iam_instance_profile   = var.iam_instance_profile

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    google_client_id     = var.google_client_id
    google_client_secret = var.google_client_secret
    aws_region          = var.aws_region
    s3_bucket_name      = var.s3_bucket_name
  }))

  tags = {
    Name        = "${var.project}-api-${var.team_name}-${var.environment}"
    Environment = var.environment
    Team        = var.team_name
  }
}

# Target Group for API
resource "aws_lb_target_group" "api_tg" {
  name     = "${var.project}-api-tg-${var.team_name}-${var.environment}"
  port     = 3001
  protocol = "HTTP"
  vpc_id   = var.vpc_id

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
    Name        = "${var.project}-api-tg-${var.team_name}-${var.environment}"
    Environment = var.environment
    Team        = var.team_name
  }
}

# Target Group Attachment
resource "aws_lb_target_group_attachment" "api_attachment" {
  target_group_arn = aws_lb_target_group.api_tg.arn
  target_id        = aws_instance.nrn_api_ec2_instance.id
  port             = 3001
}
