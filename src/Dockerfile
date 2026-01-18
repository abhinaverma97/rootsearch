# Base image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies (if any needed for python packages)
# RUN apt-get update && apt-get install -y ...

# Copy requirements first to leverage cache
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Expose port
EXPOSE 8000

# Run the application
CMD ["python", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
