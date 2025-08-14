#!/bin/bash

# Deployment script for Mastra Location Agent
# This script helps you deploy the location service to Cloudflare Workers

set -e

echo "🚀 Starting deployment to Cloudflare Workers..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI is not installed. Installing..."
    npm install -g wrangler
fi

# Check if user is logged in to Cloudflare
if ! wrangler whoami &> /dev/null; then
    echo "🔐 Please login to Cloudflare:"
    wrangler login
fi

# Type check the project
echo "🔍 Running type check..."
npm run type-check

# Check for required environment variables
echo "🔧 Checking environment variables..."

# List of required secrets
REQUIRED_SECRETS=("IPGEOLOCATION_API_KEY" "OPENAI_API_KEY")

for secret in "${REQUIRED_SECRETS[@]}"; do
    echo "Checking if $secret is set..."
    if ! wrangler secret list | grep -q "$secret"; then
        echo "⚠️  $secret is not set. Please set it using:"
        echo "   wrangler secret put $secret"
        echo ""
        read -p "Would you like to set $secret now? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            wrangler secret put "$secret"
        else
            echo "❌ Deployment cancelled. Please set all required secrets."
            exit 1
        fi
    else
        echo "✅ $secret is set"
    fi
done

# Create KV namespace if it doesn't exist
echo "📦 Setting up KV namespace..."
if ! wrangler kv:namespace list | grep -q "CACHE"; then
    echo "Creating KV namespace for caching..."
    wrangler kv:namespace create "CACHE"
    echo "⚠️  Please update your wrangler.toml with the KV namespace ID shown above"
    read -p "Press enter to continue after updating wrangler.toml..."
fi

# Deploy to production
echo "🚀 Deploying to production..."
wrangler deploy

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "🌍 Your Mastra Location Agent is now live!"
echo "📊 Check your deployment at: https://dash.cloudflare.com/"
echo "🔍 Monitor logs with: wrangler tail"
echo ""
echo "📖 API Documentation:"
echo "   - GraphQL Playground: https://your-worker-domain.workers.dev/"
echo "   - API Documentation: https://your-worker-domain.workers.dev/docs"
echo "   - Health Check: https://your-worker-domain.workers.dev/health"
echo ""
echo "🔑 Required API Keys:"
echo "   - IP Geolocation: https://ipgeolocation.io/"
echo "   - OpenAI: https://platform.openai.com/"
echo ""
echo "🎉 Happy coding!"
