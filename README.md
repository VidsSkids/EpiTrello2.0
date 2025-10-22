# Express MongoDB Authentication

This project is a Node.js backend application built with Express.js and MongoDB for user authentication. It provides routes for user registration, login, and account deletion, ensuring secure handling of user data.

## Features

- User registration with hashed passwords
- User login with authentication
- Account deletion functionality
- Unique user IDs in UUID format
- Middleware for error handling and authentication
- Input validation for user data

## Project Structure

```
express-mongo-auth
├── src
│   ├── server.ts                # Entry point of the application
│   ├── config
│   │   └── db.ts                # MongoDB connection logic
│   ├── controllers
│   │   └── auth.controller.ts    # Handles user authentication logic
│   ├── routes
│   │   └── auth.routes.ts        # Defines authentication routes
│   ├── models
│   │   └── user.model.ts         # User model schema
│   ├── services
│   │   └── user.service.ts       # Business logic for user operations
│   ├── middlewares
│   │   ├── auth.middleware.ts     # Authentication middleware
│   │   └── error.middleware.ts    # Error handling middleware
│   ├── utils
│   │   ├── hash.util.ts          # Password hashing utilities
│   │   └── uuid.util.ts          # UUID generation utility
│   ├── validators
│   │   └── auth.validator.ts      # Input validation functions
│   └── types
│       └── index.ts              # TypeScript interfaces and types
├── tests
│   └── auth.test.ts              # Unit tests for authentication
├── .env.example                   # Example environment variables
├── package.json                   # NPM configuration
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # Project documentation
```

## Getting Started

### Prerequisites

- Node.js
- MongoDB

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd express-mongo-auth
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on the `.env.example` file and configure your environment variables.

#### Local MongoDB with Docker

You can run a local MongoDB container for development. This example exposes MongoDB on host port 5001 and creates a container named `epitrello_db` with credentials username `mongo` and password `password`.

If you are logged in to Docker Hub with an unverified account, either verify your email on hub.docker.com or run `docker logout` before pulling images.

Run these commands (Windows / cross-shell):

```bash
# optional: logout if Docker Hub account email not verified
docker logout

# pull official image
docker pull mongo

# run MongoDB container
docker run -d \
  --name epitrello_db \
  -p 5001:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=mongo \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  -v epitrello_db_data:/data/db \
  mongo
```

### Running the Application

To start the server, run:
```sh
npm start
```

### API Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Log in an existing user
- `DELETE /api/auth/delete` - Delete a user account

## Testing

To run the tests, use:
```
npm test
```

## License

This project is licensed under the MIT License.
