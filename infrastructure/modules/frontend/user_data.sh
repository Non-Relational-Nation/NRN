#!/bin/bash
apt update -y

# Install Node.js 22 
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
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

# Configure nginx for SPA routing
cat > /etc/nginx/sites-available/default << 'EOL'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    root /var/www/html;
    index index.html;
    
    server_name _;
    
    # Handle SPA routing - serve index.html for all non-file requests
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Optional: Add caching for static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
}
EOL

# Start nginx
systemctl restart nginx
systemctl enable nginx
