# Stage 1: Build the React/Vite SPA
FROM node:18-alpine AS build

WORKDIR /app

# Copy package requirements
COPY package*.json ./

# Install dependecies
RUN npm ci

# Copy core files
COPY . .

# Run build to generate static files in /dist
RUN npm run build

# Stage 2: Serve the compiled app via lightweight Nginx server
FROM nginx:alpine

# Copy built files to Nginx public dir
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration to support SPA routing on port 8080
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8080 (Cloud Run's default port)
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
