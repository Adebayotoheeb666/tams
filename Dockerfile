FROM node:20-alpine AS base
WORKDIR /app

# Install devDependencies so Next.js build (tailwind, postcss, etc.) succeeds
ENV NODE_ENV=development
COPY package*.json ./
RUN npm ci

# Copy source and build the app
COPY . .
RUN npm run build

# Set production env for runtime
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "run", "start"]
