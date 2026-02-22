# Multi-stage Dockerfile for Palmer Living Reality
# Optimized for production deployment

# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy package files first for better caching
COPY client/package*.json ./

# Install dependencies with production-only dependencies
RUN npm ci --only=production

# Copy source code
COPY client/ ./

# Build for production with optimizations
ENV NODE_ENV=production
RUN npm run build

# Stage 2: Python backend
FROM python:3.11-slim AS backend

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY server/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy server application
COPY server/ ./

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/dist ./client/dist

# Expose port
EXPOSE 5555

# Set environment
ENV FLASK_ENV=production
ENV FLASK_APP=app.py

# Run the application
CMD ["python", "app.py"]

