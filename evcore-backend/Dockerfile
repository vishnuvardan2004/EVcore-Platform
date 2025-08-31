# EVcore Backend - Dockerfile for Production Deployment
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Create production stage
FROM node:18-alpine AS production

# Set environment
ENV NODE_ENV=production

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S evcore -u 1001

# Copy built application
COPY --from=builder --chown=evcore:nodejs /app .

# Create logs directory
RUN mkdir -p logs && chown -R evcore:nodejs logs

# Switch to non-root user
USER evcore

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start the application
CMD ["node", "src/server.js"]
