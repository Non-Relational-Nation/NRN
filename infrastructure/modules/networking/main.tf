# ============================================================================
# NETWORKING MODULE - VPC, Subnets, Internet Gateway, Routing, Security Groups
# ============================================================================

data "aws_availability_zones" "available_zones" {
  state = "available"
}

# VPC
resource "aws_vpc" "nrn_vpc" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.project}-vpc-${var.team_name}-${var.environment}"
    Environment = var.environment
    Team        = var.team_name
  }
}

# Internet Gateway
resource "aws_internet_gateway" "nrn_igw" {
  vpc_id = aws_vpc.nrn_vpc.id

  tags = {
    Name        = "${var.project}-igw-${var.team_name}-${var.environment}"
    Environment = var.environment
    Team        = var.team_name
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
    Name        = "${var.project}-public-rt-${var.team_name}-${var.environment}"
    Environment = var.environment
    Team        = var.team_name
  }
}

# Subnets
resource "aws_subnet" "subnet_az1" {
  vpc_id                  = aws_vpc.nrn_vpc.id
  cidr_block              = var.subnet_az1_cidr
  availability_zone       = data.aws_availability_zones.available_zones.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.project}-subnet-az1-${var.team_name}-${var.environment}"
    Environment = var.environment
    Team        = var.team_name
  }
}

resource "aws_subnet" "subnet_az2" {
  vpc_id                  = aws_vpc.nrn_vpc.id
  cidr_block              = var.subnet_az2_cidr
  availability_zone       = data.aws_availability_zones.available_zones.names[1]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.project}-subnet-az2-${var.team_name}-${var.environment}"
    Environment = var.environment
    Team        = var.team_name
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
