# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Install build tools and libraries for native modules & Prisma
RUN apt-get update -y && apt-get install -y --no-install-recommends --fix-missing python3 make g++ openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy package files (include lock file for reproducible builds)
COPY package.json package-lock.json ./

# Install dependencies using npm (matching lock file)
RUN npm ci

# Copy Prisma schema
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Install runtime dependencies (OpenSSL is needed for Prisma)
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy package files (include lock file for reproducible builds)
COPY package.json package-lock.json ./

# Install only production dependencies using npm
RUN npm ci --omit=dev

# Copy Prisma schema
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy built artifacts
COPY --from=builder /app/dist ./dist

# Create data directory for local storage
RUN mkdir -p /app/data

# Environment variables
ENV PORT=3001
ENV NODE_ENV=production
ENV STORAGE_DRIVER=local
ENV STORAGE_PATH=/app/data

# Expose port
EXPOSE 3001

# Start command
CMD ["sh", "-c", "npx prisma db push && npm start"]
