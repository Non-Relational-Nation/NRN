output "alb_dns_name" {
  value       = aws_lb.nrn_alb.dns_name
  description = "The DNS name of the Application Load Balancer"
}

output "cloudfront_domain_name" {
  value       = aws_cloudfront_distribution.nrn_distribution.domain_name
  description = "The domain name of the CloudFront distribution"
}

output "api_ec2_ip" {
  value       = module.backend.instance_private_ip
  description = "Private IP of API server"
}

output "web_ec2_ip" {
  value       = module.frontend.instance_private_ip
  description = "Private IP of Web server"
}

output "mongodb_connection_string" {
  value       = "mongodb://localhost:27017/nrn_db"
  description = "MongoDB connection string (localhost - co-located with API)"
}

output "redis_connection_string" {
  value       = "redis://localhost:6379"
  description = "Redis connection string (localhost - co-located with API)"
}

output "neo4j_connection_string" {
  value       = "bolt://localhost:7687"
  description = "Neo4j connection string (localhost - co-located with API)"
}

output "s3_bucket_name" {
  value       = aws_s3_bucket.nrn_object_storage.bucket
  description = "Name of the S3 bucket for static file storage"
}

output "api_url" {
  value       = "https://${aws_cloudfront_distribution.nrn_distribution.domain_name}/api"
  description = "URL to access the API through HTTPS via CloudFront"
}

output "web_url" {
  value       = "https://${aws_cloudfront_distribution.nrn_distribution.domain_name}"
  description = "URL to access the web application through HTTPS via CloudFront"
}


output "summary" {
  value       = <<-EOT

  🎉 Infrastructure deployed successfully!

  📝 SAVE THESE DETAILS:

  🌐 APPLICATION URLs (HTTPS with CloudFront SSL Certificate):
  
  🚀 WEB APPLICATION:
  https://${aws_cloudfront_distribution.nrn_distribution.domain_name}
  
  🔧 API ENDPOINT:
  https://${aws_cloudfront_distribution.nrn_distribution.domain_name}/api
  
  📋 CloudFront Domain: ${aws_cloudfront_distribution.nrn_distribution.domain_name}
  📋 ALB DNS Name: ${aws_lb.nrn_alb.dns_name}


  🖥️  Direct Server Access (Development):
  API Server (with co-located DBs): ${module.backend.instance_id}
  Web Server:                       ${module.frontend.instance_id}
  S3 Bucket:                        ${aws_s3_bucket.nrn_object_storage.bucket}

  🔐 SSH Commands (Ubuntu):
  ssh -i team-key ubuntu@${module.backend.instance_private_ip}
  ssh -i team-key ubuntu@${module.frontend.instance_private_ip}

  💾 Database Connections (Co-located on API server):
  MongoDB: mongodb://localhost:27017/nrn_db
  Redis:   redis://localhost:6379  
  Neo4j:   bolt://localhost:7687

  EOT
  description = "Summary of deployed infrastructure and access details"
}
