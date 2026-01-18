# Base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies required for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

# Copy package.json and lock file (if exists)
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Run the application
CMD ["npm", "start"]
