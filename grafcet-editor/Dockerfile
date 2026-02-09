# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files (include lock file for reproducible builds)
COPY package.json package-lock.json ./

# Install dependencies using npm (matching lock file)
# --legacy-peer-deps needed because @react-spring/konva doesn't officially support React 19 yet
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
# VITE_API_URL defaults to http://localhost:3001/api in apiService.ts
# This works because the browser makes requests to localhost (mapped via docker ports)
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
