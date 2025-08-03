#!/bin/bash

# ============================================================================
# SSH Key Pair Generation Script for NRN Project (Linux/Mac)
# ============================================================================

echo "🔑 Generating new SSH key pair for NRN infrastructure..."

# Create keys directory if it doesn't exist
mkdir -p keys

# Generate new SSH key pair
echo "Generating RSA key pair..."
ssh-keygen -t rsa -b 4096 -f "keys/nrn-key" -N "" -C "nrn-infrastructure-key"

if [ $? -eq 0 ]; then
    echo "✅ Key pair generated successfully!"
    
    # Copy to expected locations
    cp "keys/nrn-key" "team-key"
    cp "keys/nrn-key.pub" "team-key.pub"
    
    echo "📁 Files created:"
    echo "  - Private key: keys/nrn-key (and team-key)"
    echo "  - Public key: keys/nrn-key.pub (and team-key.pub)"
    
    echo ""
    echo "🔒 Private Key Content (for GitHub Secret):"
    echo "========================================"
    cat team-key
    echo "========================================"
    
    echo ""
    echo "🔓 Public Key Content:"
    echo "========================================"
    cat team-key.pub
    echo "========================================"
    
    echo ""
    echo "📋 Next Steps:"
    echo "1. Copy the PRIVATE key content above to GitHub Secret 'TEAM_SSH_KEY'"
    echo "2. Run: terraform plan"
    echo "3. Run: terraform apply"
    echo "4. Wait for infrastructure update to complete"
    echo "5. Run your GitHub Action workflow"
    
else
    echo "❌ Failed to generate key pair"
    echo "Make sure you have ssh-keygen installed"
fi
