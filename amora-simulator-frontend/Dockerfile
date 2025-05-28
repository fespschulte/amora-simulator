FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

# Build the application
RUN npm run build

# Verify that the build was created
RUN ls -la .next

EXPOSE 3000

# Use development mode instead of production
CMD ["npm", "run", "dev"] 