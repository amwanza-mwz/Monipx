FROM node:20-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
# Use npm install instead of npm ci since package-lock.json is not in git
RUN npm install --legacy-peer-deps && npm cache clean --force

# Copy application files
COPY . .

# Build frontend
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Create data and logs directories
RUN mkdir -p /app/data /app/logs && chown -R node:node /app/data /app/logs

# Switch to non-root user
USER node

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server (migrations run automatically on server startup)
CMD ["node", "server/server.js"]

