# Multi-stage build using uv for fast Python package installation
FROM python:3.11-slim AS builder

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Set working directory
WORKDIR /app

# Copy dependency files
COPY requirements.txt ./

# Install dependencies using uv (10-100x faster than pip)
RUN uv pip install --system --no-cache -r requirements.txt

# Runtime stage
FROM python:3.11-slim

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages

# Set working directory
WORKDIR /app

# Copy application code
COPY . .

# Expose port
EXPOSE 8080

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

# Run the application
CMD ["python", "main.py"]
