# SpendWise — Personal Finance Management System

SpendWise is a full-stack personal finance application for tracking expenses, managing budgets, and analyzing spending patterns through interactive visualizations and downloadable monthly reports.

## Features

- Transaction management: create, view, edit, delete, search, and filter expenses.
- Monthly budgets: manage an overall monthly spending limit.
- Category budgets: configure individual spending limits for Food, Transport, Shopping, Bills, Health, and Other.
- Spending analytics: view six-month spending trends and category-wise distribution.
- Monthly reports: review historical spending, budget performance, and transaction details.
- CSV export: download monthly financial reports.
- Validation and error handling: validate inputs and display API failures clearly.
- Automated tests: backend service, validation, and API integration tests using H2.

## Tech Stack

- Frontend: React, TypeScript, Vite, CSS
- Backend: Java, Spring Boot, Spring Data JPA, REST APIs
- Database: MySQL
- Build tools: Maven, npm
- Testing: JUnit, Spring Boot Test, MockMvc, H2

## Architecture

React and TypeScript frontend
  -> HTTP / REST API
Spring Boot backend
  -> Spring Data JPA
MySQL database

The frontend communicates with the backend through REST APIs. The backend handles application logic, validates requests, and persists transactions and budget records in MySQL.

## Project Structure

- backend/src/main/java: controllers, services, entities, repositories, and DTOs
- backend/src/main/resources: backend application configuration
- backend/src/test/java: automated backend tests
- frontend/src: React application and styling
- frontend/src/services: API service modules
- backend/pom.xml: Maven dependencies and build configuration
- frontend/package.json: frontend dependencies and scripts

## Prerequisites

Install Java 21 or a compatible JDK, Node.js with npm, and MySQL Server.

The Maven Wrapper is included in the backend.

## Setup and Run

### 1. Create the database

In MySQL, execute:

    CREATE DATABASE IF NOT EXISTS spendwise_db;

Configure a MySQL account with permission to access this database.

### 2. Configure and start the backend

Open a terminal at the project root and run:

    cd backend
    export DB_URL='jdbc:mysql://localhost:3306/spendwise_db'
    export DB_USERNAME='spendwise_user'
    export DB_PASSWORD='your_mysql_password'
    ./mvnw spring-boot:run

Replace your_mysql_password with the password for your configured MySQL account. Never commit actual passwords or other secrets.

The backend runs at http://localhost:8080.

### 3. Start the frontend

Open a second terminal at the project root:

    cd frontend
    npm install
    npm run dev

Open the local URL printed by Vite, normally http://localhost:5173.

Keep the frontend, backend, and MySQL running while using the application.

## Testing

Run backend automated tests:

    cd backend
    ./mvnw test

Run frontend lint:

    cd frontend
    npm run lint

Build the frontend for production:

    cd frontend
    npm run build

Backend tests use an isolated in-memory H2 database rather than the local MySQL database.

## Security Notes

- Configure database credentials using environment variables.
- Do not commit passwords, tokens, or local environment files.
- Generated build files and dependency directories are excluded through Git ignore rules.
- Production deployment requires suitable hosting, database, CORS, and security configuration.

## Future Improvements

- User authentication and individual accounts
- Cloud deployment
- Additional financial insights

---

Built as a full-stack software development project.
