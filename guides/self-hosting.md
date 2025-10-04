# 🖥️ Self-Hosting on Your VPS

Deploy Kaizen on your own Virtual Private Server (VPS) using Docker. This guide covers deployment with Docker Compose, nginx reverse proxy, and SSL certificates.

## Overview

Self-hosting gives you complete control over your infrastructure:
- ✅ No platform fees - just your VPS cost
- ✅ Full control over resources and scaling
- ✅ Direct server access for debugging
- ✅ Custom configurations and optimizations
- ✅ Data sovereignty

**Requirements:**
- A VPS with Docker installed (DigitalOcean, Linode, Vultr, etc.)
- A domain name pointed to your VPS
- Basic Linux command line knowledge

## Quick Start

### 1. Prepare Your VPS

```bash
# SSH into your VPS
ssh root@your-server-ip

# Install Docker and Docker Compose (if not already installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt-get update
apt-get install -y docker-compose-plugin
```

### 2. Clone Your Repository

```bash
# Clone your Kaizen project
git clone https://github.com/your-username/your-kaizen-project.git
cd your-kaizen-project
```

### 3. Set Up Environment Variables

Create a `.env.production` file with your production environment variables:

```bash
# Create production env file
cat > .env.production << 'EOF'
# Core
NODE_ENV=production
PORT=8080

# Convex
VITE_CONVEX_URL=https://your-prod.convex.cloud
CONVEX_DEPLOYMENT=prod:your-deployment

# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Polar.sh
POLAR_ACCESS_TOKEN=polar_...
POLAR_ORGANIZATION_ID=org_...
POLAR_WEBHOOK_SECRET=whsec_...
POLAR_SERVER=production

# Resend (optional)
RESEND_API_KEY=re_...
RESEND_WEBHOOK_SECRET=whsec_...

# OpenAI (optional)
OPENAI_API_KEY=sk-...

# Frontend URL
FRONTEND_URL=https://yourdomain.com
EOF
```

### 4. Build and Run with Docker

**Option A: Simple Docker Run**

```bash
# Build the image
docker build -t kaizen .

# Run the container
docker run -d \
  -p 8080:8080 \
  --env-file .env.production \
  --restart unless-stopped \
  --name kaizen-app \
  kaizen
```

**Option B: Docker Compose (Recommended)**

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8080:8080"
    env_file:
      - .env.production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:8080"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

Then run:

```bash
# Start the application
docker compose up -d

# View logs
docker compose logs -f

# Stop the application
docker compose down
```

## Production Setup with nginx and SSL

For a production-ready setup with HTTPS, use nginx as a reverse proxy:

### 1. Install nginx and Certbot

```bash
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx
```

### 2. Configure nginx

Create nginx configuration at `/etc/nginx/sites-available/kaizen`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
ln -s /etc/nginx/sites-available/kaizen /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 3. Get SSL Certificate

```bash
# Obtain SSL certificate from Let's Encrypt
certbot --nginx -d yourdomain.com

# Certbot will automatically configure HTTPS and set up auto-renewal
```

### 4. Update Your Application URLs

Update your `.env.production` to use HTTPS:

```bash
FRONTEND_URL=https://yourdomain.com
```

Restart your application:

```bash
docker compose restart
```

## Complete Docker Compose with nginx

For a full production setup with nginx in Docker Compose:

```yaml
version: '3.8'

services:
  app:
    build: .
    expose:
      - "8080"
    env_file:
      - .env.production
    restart: unless-stopped
    networks:
      - kaizen-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - kaizen-network

networks:
  kaizen-network:
    driver: bridge
```

## Updating Your Application

To deploy updates:

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker compose down
docker compose build --no-cache
docker compose up -d

# Or with automatic cleanup
docker compose up -d --build --force-recreate
```

## Monitoring and Maintenance

### View Logs

```bash
# Follow logs
docker compose logs -f

# View specific service logs
docker compose logs -f app

# Last 100 lines
docker compose logs --tail=100
```

### Check Resource Usage

```bash
# Docker stats
docker stats

# System resources
htop  # install with: apt-get install htop
```

### Backup Strategy

```bash
# Backup environment variables
cp .env.production .env.production.backup

# Backup docker-compose configuration
cp docker-compose.yml docker-compose.yml.backup
```

**Note:** Your actual data lives in Convex, Clerk, and Polar.sh, so no database backups are needed for the application itself.

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose logs app

# Check if port 8080 is available
netstat -tulpn | grep 8080

# Rebuild from scratch
docker compose down
docker compose build --no-cache
docker compose up -d
```

### SSL Certificate Issues

```bash
# Test nginx configuration
nginx -t

# Renew certificate manually
certbot renew --dry-run

# Check certificate status
certbot certificates
```

### Application Errors

```bash
# Check environment variables
docker compose exec app env | grep -E 'CONVEX|CLERK|POLAR'

# Restart the application
docker compose restart app

# Get shell access to debug
docker compose exec app sh
```

## Security Best Practices

1. **Firewall Configuration**
   ```bash
   # Allow SSH, HTTP, HTTPS only
   ufw allow 22
   ufw allow 80
   ufw allow 443
   ufw enable
   ```

2. **Keep System Updated**
   ```bash
   apt-get update && apt-get upgrade -y
   ```

3. **Use Environment Variables**
   - Never commit `.env.production` to git
   - Use strong, unique secrets for all API keys
   - Rotate secrets periodically

4. **Enable Automatic Security Updates**
   ```bash
   apt-get install unattended-upgrades
   dpkg-reconfigure --priority=low unattended-upgrades
   ```

## Cost Comparison

**VPS Options:**
- **DigitalOcean Droplet:** $6-12/month (1-2GB RAM)
- **Linode:** $5-12/month (1-2GB RAM)
- **Vultr:** $6-12/month (1-2GB RAM)
- **Hetzner:** €4-8/month (very affordable, EU-based)

**vs Railway:**
- Free tier: $5/month credit
- Hobby: $5/month + usage
- Pro: $20/month + usage

**Self-hosting is best when:**
- ✅ You want full control
- ✅ You have technical expertise
- ✅ You want to minimize platform fees
- ✅ You need custom server configurations

**Railway is best when:**
- ✅ You want zero maintenance
- ✅ You need PR preview environments
- ✅ You prefer managed infrastructure
- ✅ You value developer experience over cost

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
- [DigitalOcean Tutorials](https://www.digitalocean.com/community/tutorials)

---

**Need help?** Open an issue on GitHub with your deployment logs and configuration (redact secrets!).

