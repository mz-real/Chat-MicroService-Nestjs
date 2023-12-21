Based on the provided package.json and the NestJS branding guidelines, here's a README.md template for the chat microservice using NestJS.

---

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

<p align="center">
A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications, focused on the chat microservice.
</p>

<p align="center">
<!-- Badges Section -->
<!-- Add your badges here -->
</p>

## Description

This repository contains the implementation of a chat microservice built with the [Nest](https://github.com/nestjs/nest) framework. It allows real-time communication between users and supports various operations like creating conversations, sending and receiving messages, etc.

## Installation

To install the dependencies, run the following command:

```bash
$ npm install
```

## Running the App

To start the application, use one of the following commands:

```bash
# Development
$ npm run start

# Watch mode
$ npm run start:dev

# Production mode
$ npm run start:prod
```

You can also start the app using Docker:

```bash
# Start the app with Docker
$ npm run start:app

# Stop the app with Docker
$ npm run stop:app
```

## Testing

To run the tests for the application, use the following commands:

```bash
# Unit tests
$ npm run test

# End-to-end tests
$ npm run test:e2e

# Test coverage
$ npm run test:cov
```

## Docker

The microservice can be run as a Docker container. The configuration can be found in the `docker-compose.yml` file.

## Swagger Documentation

Swagger documentation can be accessed at `http://localhost:3002/docs` after starting the application.

## Support

If you encounter any problems or have any suggestions, please open an issue in the repository.

## Stay in Touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

This software is licensed under the [MIT license](LICENSE).

---

**Note:** Replace the placeholder text in the "Badges Section" comment with the actual badges you wish to display, such as NPM version, build status, or any other relevant information.

The README provides a quick overview of the project, installation instructions, commands to run and test the application, and contact information for the creators and contributors. The docker-compose and Swagger documentation sections provide additional details on running the app in a containerized environment and accessing the API documentation, respectively.