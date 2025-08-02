# NRN External Server Communication Guide

## 🌐 Current External Access Configuration

### ✅ PUBLIC ENDPOINTS (Anyone can access):
- **Web Application**: `https://[alb-dns-name]` (Port 443)
- **API Endpoints**: `https://[alb-dns-name]/api/*` (Port 443)
- **SSH Access**: Direct to EC2 instances (Port 22) - Requires SSH key

### 🔒 SECURED ENDPOINTS (Restricted access):
- **Application Ports**: 3000, 5000 - Only accessible via ALB
- **Databases**: MongoDB (27017), Redis (6379) - Localhost only
- **Neo4j**: Ports 7474, 7687 - Now restricted to ALB traffic only

## 🤝 How External Servers Can Communicate

### Option 1: Public API Access (Recommended)
External servers can call your APIs through the load balancer:

```bash
# Example API calls from external servers
curl -k https://[your-alb-dns]/api/health
curl -k https://[your-alb-dns]/api/users
curl -k -X POST https://[your-alb-dns]/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Hello","content":"World"}'
```

### Option 2: Whitelist Specific External Servers
To allow specific external servers direct access to your API servers:

1. **Get the external server's public IP address**
2. **Add to security group** (uncomment and modify in main.tf):

```hcl
# In the external_api_sg security group, add:
ingress {
  from_port   = 5000  # Your API port
  to_port     = 5000
  protocol    = "tcp"  
  cidr_blocks = ["203.0.113.0/24"]  # Replace with external server IP/range
  description = "Allow Partner Company API Server"
}
```

### Option 3: VPC Peering (Advanced)
For high-throughput, secure communication between AWS accounts:
- Set up VPC peering between your VPC and partner's VPC
- Configure route tables for private IP communication
- Ideal for B2B integrations and microservices

### Option 4: API Gateway + Lambda (Serverless)
For event-driven communication:
- Set up AWS API Gateway webhooks
- Use Lambda functions to process external requests
- Forward processed data to your NRN API

## 🔐 Security Best Practices

### Currently Implemented:
- ✅ HTTPS encryption with TLS 1.2+
- ✅ Database access restricted to localhost or ALB only  
- ✅ Application ports only accessible via load balancer
- ✅ Separate security groups for different access patterns

### Recommended Additions:
- 🔑 **API Authentication**: Implement JWT or API keys
- 🚦 **Rate Limiting**: Prevent abuse with request throttling
- 📊 **Access Logging**: Monitor external API calls
- 🛡️ **WAF**: Add Web Application Firewall for DDoS protection
- 🔍 **IP Whitelisting**: Only allow known partner IPs

## 📋 Integration Examples

### For Partner Companies:
```javascript
// JavaScript/Node.js example
const response = await fetch('https://your-alb-dns/api/users', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  }
});
```

### For Mobile Apps:
```swift
// Swift/iOS example
let url = URL(string: "https://your-alb-dns/api/posts")!
var request = URLRequest(url: url)
request.httpMethod = "POST"
request.setValue("application/json", forHTTPHeaderField: "Content-Type")
```

### For IoT Devices:
```python
# Python example for IoT sensors
import requests

response = requests.post(
    'https://your-alb-dns/api/sensor-data',
    json={'temperature': 25.6, 'humidity': 60.2},
    headers={'X-API-Key': 'your-api-key'},
    verify=False  # Only because of self-signed cert
)
```

## 🚀 Deployment Checklist

After running `terraform apply`, external servers can immediately:
- ✅ Access your public API endpoints via HTTPS
- ✅ Send webhooks to your application
- ✅ Integrate with your NRN social media platform
- ✅ Connect securely through the load balancer

## 🔧 Troubleshooting External Connections

### Common Issues:
1. **Certificate Warnings**: Use `-k` flag in curl or equivalent in code
2. **Timeout Issues**: Check security group rules and network connectivity
3. **CORS Errors**: Configure CORS headers in your API for browser requests
4. **Rate Limiting**: Implement exponential backoff in client code

### Testing Commands:
```bash
# Test connectivity from external server
curl -k -v https://[your-alb-dns]/api/health
nmap -p 443 [your-alb-dns]
telnet [your-alb-dns] 443
```

## 📞 Summary

Your NRN infrastructure is **ready for external server communication** through:
- 🌍 **Public HTTPS APIs** via load balancer (most common)
- 🔐 **Whitelisted direct access** for trusted partners  
- 🏢 **Enterprise integration** patterns available

All database access is properly secured, and you have flexible options for different integration scenarios!
