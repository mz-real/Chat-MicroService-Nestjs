# Use an official Node runtime as a parent image
FROM node:16.19.0

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install any needed packages specified in package.json
RUN npm install

# Copy .env file
COPY .env ./

# Bundle the source code inside the Docker image
COPY . .

# Build the application
RUN npm run build

# Define the command to run the app
CMD ["npm", "run", "start:dev"]
