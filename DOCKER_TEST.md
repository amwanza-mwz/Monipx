# 🐳 Docker Testing Guide

## Prerequisites

1. **Docker Desktop** must be installed and running
2. Check Docker is running:
   ```bash
   docker info
   ```

## Quick Start

### Option 1: Using the Test Script (Recommended)

```bash
./docker-test.sh
```

This script will:
- ✅ Check if Docker is running
- ✅ Clean up existing containers
- ✅ Build the Docker image
- ✅ Start the container
- ✅ Show status and logs

### Option 2: Manual Steps

#### Step 1: Build the Image

```bash
docker-compose build
```

Or using Docker directly:
```bash
docker build -t monipx:latest .
```

#### Step 2: Start the Container

```bash
docker-compose up -d
```

Or using Docker directly:
```bash
docker run -d \
  --name monipx \
  -p 3001:3001 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  monipx:latest
```

#### Step 3: Check Status

```bash
docker-compose ps
```

Or:
```bash
docker ps | grep monipx
```

#### Step 4: View Logs

```bash
docker-compose logs -f
```

Or:
```bash
docker logs -f monipx
```

## Access the Application

Once the container is running, access Monipx at:

**http://localhost:3001**

## Testing Checklist

- [ ] Container starts successfully
- [ ] Application loads at http://localhost:3001
- [ ] Database is initialized (check logs)
- [ ] Can create subnets
- [ ] Can view IP addresses
- [ ] Can edit IPs with domain/hostname
- [ ] Theme switching works
- [ ] Language switching works

## Common Commands

### View Logs
```bash
docker-compose logs -f
```

### Stop Container
```bash
docker-compose down
```

### Restart Container
```bash
docker-compose restart
```

### Rebuild and Restart
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Access Container Shell
```bash
docker-compose exec monipx sh
```

### Check Database
```bash
docker-compose exec monipx sh -c "sqlite3 /app/data/monipx.db 'SELECT * FROM subnets;'"
```

## Troubleshooting

### Issue: Port 3001 Already in Use

**Solution:**
```bash
# Find process using port 3001
lsof -i :3001

# Kill the process or change port in docker-compose.yml
```

### Issue: Container Won't Start

**Check logs:**
```bash
docker-compose logs
```

**Common causes:**
- Database migration failed
- Port conflict
- Volume permission issues

### Issue: Database Errors

**Reset database:**
```bash
docker-compose down
rm -rf data/monipx.db
docker-compose up -d
```

### Issue: Permission Denied on Volumes

**Fix permissions:**
```bash
sudo chown -R $USER:$USER data/ logs/
```

## Health Check

The container includes a health check. View health status:

```bash
docker inspect monipx | grep -A 10 Health
```

## Data Persistence

Data is stored in:
- `./data/monipx.db` - SQLite database
- `./logs/` - Application logs

These directories are mounted as volumes, so data persists even if the container is removed.

## Production Deployment

For production, consider:
- Using environment variables for configuration
- Setting up reverse proxy (nginx)
- Using PostgreSQL instead of SQLite
- Setting up SSL/TLS certificates
- Configuring backups

---

**Happy Testing! 🎉**

