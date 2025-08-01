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

# ALB Outputs
output "alb_dns_name" {
  value       = aws_lb.nrn_alb.dns_name
  description = "DNS name of the Application Load Balancer"
}

output "alb_zone_id" {
  value       = aws_lb.nrn_alb.zone_id
  description = "Zone ID of the Application Load Balancer"
}

output "api_url" {
  value       = "http://${aws_lb.nrn_alb.dns_name}/api"
  description = "API URL using load balancer DNS (path-based routing)"
}

output "web_url" {
  value       = "http://${aws_lb.nrn_alb.dns_name}/web"
  description = "Web URL using load balancer DNS (path-based routing)"
}

output "root_url" {
  value       = "http://${aws_lb.nrn_alb.dns_name}"
  description = "Root URL (defaults to API)"
}

output "summary" {
  value = <<-EOT

  🎉 Infrastructure deployed successfully!

  📝 SAVE THESE DETAILS:

  🌐 APPLICATION URLs (Free Load Balancer DNS):
  
  🚀 API ENDPOINT:
  http://${aws_lb.nrn_alb.dns_name}/api
  
  🌐 WEB APPLICATION:
  http://${aws_lb.nrn_alb.dns_name}/web
  
  📋 ROOT URL (defaults to API):
  http://${aws_lb.nrn_alb.dns_name}
  
  � TESTING COMMANDS:
  Test API: curl http://${aws_lb.nrn_alb.dns_name}/api/health
  Test Web: curl http://${aws_lb.nrn_alb.dns_name}/web
  
  📋 ALB DNS Name: ${aws_lb.nrn_alb.dns_name}

  🖥️  Direct Server Access (Development):
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

  💰 COST-EFFECTIVE: No Route53 charges, no SSL certificate costs!

  EOT
}
