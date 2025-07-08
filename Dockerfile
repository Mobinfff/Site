# Use Node.js base image
FROM node:18

# Create app directory inside container
WORKDIR /app

# Copy backend folder
COPY backend ./backend

# Set working directory to backend
WORKDIR /app/backend

# Install dependencies
RUN npm install

# Run app in dev mode (no build step needed)
CMD ["npm", "run", "start:dev"]
