# Python stage
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
# gcc/python3-dev might be needed for some python packages
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
# Add /app to PYTHONPATH so imports work correctly
ENV PYTHONPATH=/app

# Expose port
EXPOSE 8000

# Start command
CMD ["python", "agents/orchestrator.py"]
