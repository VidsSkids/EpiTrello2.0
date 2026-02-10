# EpiTrello Backend Architecture Documentation

## 📋 Overview

This is a **Trello-like project management backend** built with **Express.js**, **TypeScript**, and **MongoDB**. It implements a RESTful API with authentication, role-based access control, and real-time collaboration features for managing projects, columns, cards, and checklists.

---

## 🏗️ Architecture Pattern

The backend follows a **layered architecture** (also called **N-tier architecture**) organized by feature:

```
Request → Routes → Controllers → Services → Models → Database
           ↓
      ↓ Middleware ↓
      ↓ Validators ↓
      ↓ Error Handling ↓
```

### Key Layers

| Layer | Purpose | Contains |
|-------|---------|----------|
| **Routes** | Define API endpoints | `routes/` |
| **Controllers** | Handle HTTP requests/responses | `controllers/` |
| **Services** | Business logic & operations | `services/` |
| **Models** | Data schema & database structure | `models/` |
| **Middlewares** | Cross-cutting concerns (auth, validation, error handling) | `middlewares/` |
| **Validators** | Input validation rules | `validators/` |

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── server.ts                 # Entry point, Express app setup
│   ├── errors.ts                 # Custom error classes
│   ├── config/
│   │   └── db.ts                 # MongoDB connection configuration
│   ├── models/                   # Mongoose schemas
│   │   ├── user.model.ts
│   │   ├── project.model.ts
│   │   ├── column.model.ts
│   │   ├── card.model.ts
│   │   └── tag.model.ts
│   ├── routes/                   # API route definitions
│   │   ├── auth.routes.ts
│   │   ├── project.routes.ts
│   │   ├── column.routes.ts
│   │   ├── card.routes.ts
│   │   ├── tag.routes.ts
│   │   └── checklist.routes.ts
│   ├── controllers/              # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── project.controller.ts
│   │   ├── column.controller.ts
│   │   ├── card.controller.ts
│   │   ├── tag.controller.ts
│   │   └── checklist.controller.ts
│   ├── services/                 # Business logic
│   │   ├── user.service.ts
│   │   ├── project.service.ts
│   │   ├── column.service.ts
│   │   ├── card.service.ts
│   │   ├── tag.service.ts
│   │   └── checklist.service.ts
│   ├── middlewares/              # Express middlewares
│   │   ├── auth.middleware.ts    # JWT authentication
│   │   ├── permission.middleware.ts  # Role-based access control
│   │   └── error.middleware.ts   # Global error handler
│   ├── validators/               # Input validation schemas
│   │   ├── auth.validator.ts
│   │   ├── project.validator.ts
│   │   ├── column.validator.ts
│   │   ├── card.validator.ts
│   │   ├── tag.validator.ts
│   │   └── checklist.validator.ts
│   └── utils/
│       ├── hash.util.ts          # Password hashing utilities
│       └── uuid.util.ts          # UUID generation utilities
├── tests/                        # Jest test files
├── jest.config.cjs
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started for Development

### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)
- npm or yarn

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file** in the `backend/` directory:
   ```env
   PORT=5000
   DATABASE_URL=mongodb://localhost:27017/epitrello
   JWT_SECRET=your_secret_key_here
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   FRONTEND_LOGIN_URL=http://localhost:4200/login
   FRONTEND_GOOGLE_URL=http://localhost:4200/dashboard
   NODE_ENV=development
   ```

3. **Start development server:**
   ```bash
   npm start
   ```

   Server runs on `http://localhost:5000`

4. **Build for production:**
   ```bash
   npm run build
   npm run start-build
   ```

### Available Commands

```bash
npm start              # Run with ts-node (development)
npm run build          # Compile TypeScript to JavaScript
npm run start-build    # Run compiled distribution
npm test               # Run Jest tests
npm run tsc:check      # Type-check without compiling
npm run lint           # Run ESLint and fix issues
npm run clean:fix      # Run linting + type checking
npm run find:unused-exports   # Find unused exports
npm run find:orphans          # Find orphaned code
npm run find:unused-deps      # Find unused dependencies
```

---

## 🔐 Authentication & Authorization

### Authentication Flow

The backend supports **two authentication methods**:

#### 1. **Local Authentication** (Username/Password)
- User registers with name and password
- Password is hashed using bcrypt
- Login generates JWT token used for subsequent requests

**Routes:**
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Get JWT token

#### 2. **Google OAuth 2.0**
- Users authenticate via Google
- Callback stores user with `provider: 'google'`
- JWT token generated and redirected to frontend

**Routes:**
- `GET /api/auth/google` - Start OAuth flow
- `GET /api/auth/google/callback` - OAuth callback (Passport handles this)

### Authorization: Role-Based Access Control (RBAC)

#### User Roles in Projects

Projects implement 4-tier role hierarchy:

| Role | Permissions | Use Case |
|------|-------------|----------|
| **Owner** | All permissions, delete project, manage all members | Project creator |
| **Administrator** | Invite users, manage members, edit project | Team lead |
| **Contributer** | Create/edit cards, columns; cannot invite or manage members | Team member |
| **Reader** | View-only access to project | Stakeholder/Observer |

#### How Authorization Works

1. **Auth Middleware** (`auth.middleware.ts`)
   - Verifies JWT token from `Authorization: Bearer <token>` header
   - Extracts user `id` and `name` from token payload
   - Attaches user info to `req.user`

2. **Permission Middleware** (`permission.middleware.ts`)
   - Checks if user has required role for the action
   - `GET` requests need "read" permission (all roles)
   - `POST/PATCH/DELETE` requests need "write" permission (Owner/Admin/Contributer)

### Request Flow Example

```
1. Client sends: GET /api/projects/abc123
   Header: Authorization: Bearer eyJhbGc...

2. auth.middleware.ts
   ✓ Validates JWT signature
   ✓ Extracts payload: { id: "user-uuid", name: "John" }
   ✓ Attaches to req.user

3. Controller processes request
   ✓ Calls ProjectService.getProject(projectId)

4. Service checks permissions
   ✓ Finds user's role in project
   ✓ Verifies user is project member
   ✓ Returns data or throws error

5. Response sent to client
```

---

## 📊 Data Models

All models use MongoDB with Mongoose ODM.

### User Model
```typescript
{
  id: string (UUID)           // Unique user identifier
  name: string                // Username (unique)
  email: string               // Email (unique, optional for local auth)
  googleId: string            // Google profile ID (if OAuth)
  password: string            // Hashed password (if local auth)
  provider: 'local' | 'google'
  providerId: string          // OAuth provider ID
  timestamps: Date[]          // createdAt, updatedAt
}
```

### Project Model
```typescript
{
  uuid: string                // Unique project identifier
  name: string                // Project name
  ownerId: string             // User ID of project owner
  members: [                  // Team members
    {
      userId: string          // User's UUID
      username: string        // User's display name
      role: ProjectRole       // One of: Owner, Administrator, Contributer, Reader
    }
  ]
  invitations: [              // Pending invitations
    {
      name: string            // Invited user's name
      invitedBy: string       // Inviter's user ID
      createdAt: Date
    }
  ]
  columns: IProjectColumn[]   // Project columns (embedded)
  tags: IProjectTag[]         // Project tags (embedded)
  timestamps: Date[]          // createdAt, updatedAt
}
```

### Column Model (Embedded in Project)
```typescript
{
  _id: ObjectId
  name: string                // Column name (e.g., "To Do", "In Progress")
  cards: IProjectCard[]       // Cards in this column (embedded)
  createdAt: Date
}
```

### Card Model (Embedded in Column)
```typescript
{
  _id: ObjectId
  title: string               // Card title
  description: string         // Card details
  isDone: boolean             // Completion status
  dueDate: Date               // Optional deadline
  startDate: Date             // Optional start date
  assignedTo: string[]        // Array of user IDs
  tagIds: string[]            // Array of tag IDs
  checklists: ICardChecklist[] // Nested checklists
  createdAt: Date
}
```

### Checklist Model (Embedded in Card)
```typescript
{
  _id: ObjectId
  title: string               // Checklist name
  items: [                    // Checklist items
    {
      _id: ObjectId
      content: string         // Item text
      isChecked: boolean
      dueDate: Date           // Optional deadline
      assignedTo: string[]    // Optional assignees
    }
  ]
}
```

### Tag Model (Embedded in Project)
```typescript
{
  _id: ObjectId
  name: string                // Tag label
  color: string               // Hex color code (e.g., "#FF5733")
}
```

---

## 🔄 Request/Response Flow

### Example: Create a Project

```typescript
// 1. CLIENT REQUEST
POST /api/projects
Authorization: Bearer <jwt_token>
Body: { "name": "My New Project" }

// 2. ROUTE HANDLER (project.routes.ts)
router.post('/', authMiddleware, validateCreateProject, controller.create)

// 3. VALIDATION (validators/project.validator.ts)
validateCreateProject checks:
  - name is not empty
  - name is string

// 4. CONTROLLER (controllers/project.controller.ts)
async create(req, res, next) {
  const userId = req.user.id;
  const { name } = req.body;
  const project = await projectService.createProject(name, userId);
  res.status(201).json(project);
}

// 5. SERVICE (services/project.service.ts)
async createProject(name, ownerId) {
  - Validate input
  - Generate UUID
  - Create document with owner as member
  - Save to MongoDB
  - Return project data
}

// 6. MODEL (models/project.model.ts)
// Mongoose handles saving to MongoDB

// 7. RESPONSE
{
  "id": "abc-123-def",
  "name": "My New Project",
  "ownerId": "user-uuid",
  "createdAt": "2024-02-10T...",
  "updatedAt": "2024-02-10T..."
}
```

---

## ⚠️ Error Handling

Custom error hierarchy allows predictable error responses:

```typescript
// errors.ts
HttpError (base)
  ├── NotFoundError (404)
  ├── ForbiddenError (403)
  ├── BadRequestError (400)
  └── ConflictError (409)
```

### Error Handling Flow

```
Controller throws error → error.middleware.ts → Client
                              ↓
                        instanceof HttpError?
                         ├─ Yes: Return status + message
                         └─ No: Return 500 + stack trace (dev only)
```

### Example Error Response

```json
{
  "success": false,
  "message": "Project not found"
}
```

---

## 🧪 Testing

Tests are in the `tests/` directory using **Jest**:

```typescript
// tests/auth.test.ts
describe('Auth Controller', () => {
  it('should register a user', async () => {
    // Test implementation
  });
});
```

**Run tests:**
```bash
npm test                    # Run all tests
npm test -- --watch        # Watch mode
npm test -- --coverage     # With coverage report
```

---

## 📚 Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `express` | ^4.17.1 | Web framework |
| `mongoose` | ^8.19.2 | MongoDB ODM |
| `jsonwebtoken` | ^9.0.3 | JWT token management |
| `bcrypt` | ^5.0.1 | Password hashing |
| `passport` | ^0.7.0 | Authentication strategies |
| `passport-google-oauth20` | ^2.0.0 | Google OAuth |
| `cors` | ^2.8.5 | Cross-Origin Resource Sharing |
| `dotenv` | ^8.2.0 | Environment variables |
| `uuid` | ^8.3.2 | UUID generation |
| `typescript` | - | Type safety |
| `jest` | ^30.2.0 | Testing framework |

---

## 🔄 Common Workflows

### Adding a New Feature

1. **Create/Update Model** (`models/`)
   - Define MongoDB schema and interfaces

2. **Create/Update Service** (`services/`)
   - Implement business logic
   - Handle database operations

3. **Create/Update Controller** (`controllers/`)
   - Handle HTTP requests
   - Call services
   - Format responses

4. **Create/Update Routes** (`routes/`)
   - Define endpoints
   - Add middlewares
   - Link to controllers

5. **Create/Update Validators** (`validators/`)
   - Validate request inputs

6. **Add Tests** (`tests/`)
   - Test service logic
   - Test API endpoints

### Handling a Request

1. Request hits route
2. Middlewares execute (auth, validation)
3. Controller is called
4. Service handles business logic
5. Database operation via Model
6. Response sent back through controller
7. Error middleware catches any errors

---

## 🎯 Best Practices

### Code Organization

- **Keep controllers thin**: Move complex logic to services
- **Keep services stateless**: Rely on dependency injection
- **Use strong typing**: Define interfaces for all data structures
- **Validate inputs**: Always validate in route validators
- **Use custom errors**: Throw HttpError subclasses for consistent responses

### Security

- ✅ Passwords hashed with bcrypt
- ✅ JWTs validate all requests
- ✅ Role-based access control on protected routes
- ✅ Environment variables for secrets
- ✅ CORS enabled for frontend communication
- ⚠️ Remember to validate sensitive operations server-side

### Database

- Embedded documents (columns, cards) for performance
- UUID for external-facing IDs
- MongoDB ObjectId for internal references
- Indexes on frequently queried fields

### Error Handling

```typescript
// Good ✅
try {
  const user = await userService.getUserById(id);
  if (!user) throw new NotFoundError('User not found');
  res.json(user);
} catch (err) {
  next(err);  // Pass to error middleware
}

// Bad ❌
res.json(user || null);  // Hides errors
```

---

## 📖 API Endpoints Summary

### Auth
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login and get token
- `DELETE /api/auth/:id` - Delete user
- `GET /api/auth/ping` - Test auth (protected)
- `GET /api/auth/google` - Google OAuth start
- `GET /api/auth/google/callback` - Google OAuth callback

### Projects
- `POST /api/projects` - Create project
- `GET /api/projects` - Get user's projects
- `GET /api/projects/:id` - Get project details
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/invite` - Invite user
- `POST /api/projects/:id/accept` - Accept invitation
- `POST /api/projects/:id/decline` - Decline invitation
- `POST /api/projects/:id/remove/:memberId` - Remove member
- `POST /api/projects/:id/leave` - Leave project
- `PATCH /api/projects/:id/members/:memberId/role` - Change role

### Columns
- `POST /api/projects/:projectId/columns` - Create column
- `GET /api/projects/:projectId/columns` - List columns
- `PATCH /api/projects/:projectId/columns/:columnId` - Update column
- `DELETE /api/projects/:projectId/columns/:columnId` - Delete column

### Cards
- `POST /api/projects/:projectId/columns/:columnId/cards` - Create card
- `PATCH /api/projects/:projectId/columns/:columnId/cards/:cardId` - Update card
- `DELETE /api/projects/:projectId/columns/:columnId/cards/:cardId` - Delete card

### Tags
- `POST /api/projects/:projectId/tags` - Create tag
- `GET /api/projects/:projectId/tags` - List tags
- `PATCH /api/projects/:projectId/tags/:tagId` - Update tag
- `DELETE /api/projects/:projectId/tags/:tagId` - Delete tag

### Checklists
- `POST /api/projects/:projectId/columns/:columnId/cards/:cardId/checklists` - Create checklist
- `PATCH /api/projects/:projectId/columns/:columnId/cards/:cardId/checklists/:checklistId` - Update checklist
- `DELETE /api/projects/:projectId/columns/:columnId/cards/:cardId/checklists/:checklistId` - Delete checklist

---

## 🐛 Troubleshooting

### MongoDB Connection Issues
```
Error: MONGODB_URI is not defined in environment variables
→ Check .env file has DATABASE_URL
→ Verify MongoDB service is running
```

### JWT Token Errors
```
Error: Invalid or expired token
→ Token might be expired (generate new login)
→ JWT_SECRET might not match between signing/verification
→ Check Authorization header format: "Bearer <token>"
```

### TypeScript Errors
```bash
npm run tsc:check    # Check for type errors
npm run lint         # Fix linting issues
```

---

## 📞 Support & Questions

For questions about the architecture:
1. Check the relevant model, service, and controller files
2. Review test files for usage examples
3. Refer to inline code comments
4. Check the OpenAPI documentation in `Documentation/openapi.yaml`

---

## 📝 Notes for New Developers

- **Start with models**: Understand data structures first
- **Then services**: See how data is manipulated
- **Then routes/controllers**: Understand the API flow
- **Read tests**: They show expected behavior
- **Type everything**: TypeScript's strict mode prevents bugs
- **Error handling**: Always use try-catch and pass to error middleware
- **Ask questions**: It's better to ask than to make assumptions

Happy coding! 🚀
