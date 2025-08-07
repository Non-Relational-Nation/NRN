#!/bin/bash
apt update -y

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
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

# Install MongoDB 
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

# Install Redis 
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
AWS_REGION=${aws_region}
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=${s3_bucket_name}
FEDERATION_ENABLED=false
FEDERATION_DOMAIN=CLOUDFRONT_DOMAIN_PLACEHOLDER
FEDERATION_PUBLIC_KEY=
FEDERATION_PRIVATE_KEY=
FEDERATION_USER_AGENT=NRN/1.0.0
GOOGLE_CLIENT_ID=${google_client_id}
GOOGLE_CLIENT_SECRET=${google_client_secret}
GOOGLE_REDIRECT_URL=https://CLOUDFRONT_DOMAIN_PLACEHOLDER/login/callback
SERVER_URL=https://d3m0gyk7rj0vr1.cloudfront.net
SERVER_DOMAIN=d3m0gyk7rj0vr1.cloudfront.net
EOL

chown ubuntu:ubuntu /home/ubuntu/app/.env

# Clone your repository
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

# Create systemd service for the backend
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
