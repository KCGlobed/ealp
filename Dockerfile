# Use Nginx to serve the static content
FROM nginx:alpine

# Install apache2-utils to get htpasswd command
RUN apk add --no-cache apache2-utils

# Generate .htpasswd file with a default username and password
RUN htpasswd -bc /etc/nginx/.htpasswd admin password

# Copy the static files to the Nginx html directory
COPY . /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8080
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]