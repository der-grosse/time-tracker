# Use the official Node.js image as the base image
FROM node:22-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

ARG NEXT_PUBLIC_CONVEX_URL
ENV NEXT_PUBLIC_CONVEX_URL=$NEXT_PUBLIC_CONVEX_URL
ENV CI=true

# Build the Next.js application
RUN pnpm run build

# Use node for production
FROM node:22-slim AS production

# Install pnpm
RUN npm install -g pnpm

# Set the working directory
WORKDIR /app

ENV CI=true

# Copy only the necessary files from the build stage
COPY --from=base /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public

RUN pnpm install --frozen-lockfile --prod

# Expose the port the app runs on
EXPOSE 3000

# Start the Next.js application
CMD ["npm", "run", "start"]