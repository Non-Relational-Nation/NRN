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
