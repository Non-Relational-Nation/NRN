# ============================================================================
# FRONTEND MODULE - Web Server, Load Balancer Target Group
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

# Web EC2 Instance
resource "aws_instance" "nrn_web_ec2_instance" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = var.key_name
  subnet_id              = var.subnet_id
  vpc_security_group_ids = [var.security_group_id]
  iam_instance_profile   = var.iam_instance_profile

  user_data = base64encode(file("${path.module}/user_data.sh"))

  tags = {
    Name        = "${var.project}-web-${var.team_name}-${var.environment}"
    Environment = var.environment
    Team        = var.team_name
  }
}

# Target Group for Web
resource "aws_lb_target_group" "web_tg" {
  name     = "${var.project}-web-tg-${var.team_name}-${var.environment}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = var.vpc_id

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
    Name        = "${var.project}-web-tg-${var.team_name}-${var.environment}"
    Environment = var.environment
    Team        = var.team_name
  }
}

# Target Group Attachment
resource "aws_lb_target_group_attachment" "web_attachment" {
  target_group_arn = aws_lb_target_group.web_tg.arn
  target_id        = aws_instance.nrn_web_ec2_instance.id
  port             = 80
}
