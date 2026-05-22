# Use an official, lightweight Python runtime as a parent image
FROM python:3.11-slim

# Set system environment variables to optimize Python inside a container
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set the working directory inside the container
WORKDIR /app

# Install system dependencies required for pdf2docx and psycopg2 compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy just the requirements file first to leverage Docker caching layers
COPY requirements.txt .

# Install Python packages directly into the container engine
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application code into the container
COPY . .

# Expose the network port FastAPI will listen on
EXPOSE 8000

# Command to run Uvicorn when the container starts up
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]