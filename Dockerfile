# ==============================
# Stage 1: Build React + Vite
# ==============================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build React application
RUN npm run build


# ==============================
# Stage 2: Run with Nginx
# ==============================
FROM nginx:alpine

# Copy Vite build output to Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]