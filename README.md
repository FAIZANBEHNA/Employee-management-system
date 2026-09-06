# Employee Management System

A full-stack Employee Management application built with React, Node.js, Express, GraphQL, and MySQL.

## Project Structure

This project contains both the frontend and backend code merged into the root directory:

```text
├── db/               # Database connections and configurations
├── graphql/          # GraphQL schemas and resolvers    
├── public/           # Static assets and HTML templates
├── src/              # React frontend source files
├── .gitignore        # Git ignore configurations
├── package.json      # Node.js dependencies & scripts
├── server.js         # Backend server entry point
└── README.md         # Project documentation

Prerequisites 

Make sure you have the following installed on your machine:

Node.js (v14 or higher)

MySQL

Tech Stack

Frontend: React, HTML, CSS, JavaScript

Backend: Node.js, Express, GraphQL

Database: MySQL

Frontend
mini-employee-management-frontend/
├── public/
├── src/
│   ├── api/
│   │   └── graphql.js           # Lightweight fetch wrapper for GraphQL POST requests
│   ├── components/
│   │   ├── EmployeeForm.js      # Form for adding & editing employees with validation
│   │   ├── EmployeeList.js      # Table with search filters, actions, and pagination
│   │   └── Sidebar.js           # Navigation bar component
│   ├── App.js                   # Main application state & dashboard container
│   ├── index.css                # Custom CSS design system
│   └── index.js                 # React entry point
└── package.json

Backend
Plaintext
mini-employee-management-backend/
├── db/
│   └── connection.js          # MySQL2 connection pool & connection health-check
├── graphql/
│   ├── schema.js              # GraphQL type definitions and SDL schema string
│   └── resolvers.js           # Business logic, query resolvers, and mutations
├── migration/
│   └── migration.js           # Schema migration and database setup script
├── scripts/
│   └── migrate.js             # Alternative schema migration/seeding script runner
├── public/
│   ├── index.html             # Frontend HTML fallback / landing page
│   └── migration.html         # Web interface for triggering migrations manually
├── .env                       # Environment variables (PORT, DB credentials, FRONTEND_URL)
├── package.json               # Project manifest, dependencies, and npm scripts
└── server.js                  # Express server entry point with GraphQL & migration endpoints
<img width="1909" height="960" alt="Screenshot 2026-09-06 103354" src="https://github.com/user-attachments/assets/3d8ac2c5-aea1-4948-b63e-4d7db6af068d" />
<img width="1909" height="960" alt="Screenshot 2026-09-06 103354" src="https://github.com/user-attachments/assets/1fe6362a-1266-4242-8555-2ec475df67a9" />
![Uploading Screenshot 2026-09-06 103354.png…]()


