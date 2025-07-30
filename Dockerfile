FROM node:18-alpine

# Install Poppler utilities (including pdftocairo)
RUN apk add --no-cache poppler-utils

# Declare build arguments for environment variables needed at build time
ARG OPENAI_API_KEY
ARG UPSTASH_REDIS_REST_URL
ARG UPSTASH_REDIS_REST_TOKEN
ARG DATABASE_URL
ARG LOG_LEVEL
ARG NODE_ENV
ARG DEBUG

# Set environment variables from build arguments
ENV OPENAI_API_KEY=$OPENAI_API_KEY
ENV UPSTASH_REDIS_REST_URL=$UPSTASH_REDIS_REST_URL
ENV UPSTASH_REDIS_REST_TOKEN=$UPSTASH_REDIS_REST_TOKEN
ENV DATABASE_URL=$DATABASE_URL
ENV LOG_LEVEL=$LOG_LEVEL
ENV NODE_ENV=$NODE_ENV
ENV DEBUG=$DEBUG

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev deps needed for build)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application (ensure we have all dependencies)
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 