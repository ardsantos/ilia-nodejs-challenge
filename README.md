# Ília Banking Platform - Microservices Challenge

A production-ready distributed banking system built with Node.js, TypeScript, and PostgreSQL, featuring two core microservices with ACID guarantees, resilience patterns, and comprehensive testing.

## 🏗️ Architecture

This project implements a microservices architecture with the following components:

### **ms-users** (Port 3002)

User management and authentication service

- User registration and login with JWT
- Password hashing with bcrypt (12+ salt rounds)
- Protected routes with middleware
- Automatic wallet creation on registration

### **ms-wallet** (Port 3001)

Wallet and transaction management with ACID guarantees

- Transaction processing (CREDIT/DEBIT)
- Balance calculation via aggregation
- Insufficient funds validation
- Service-to-service internal endpoints
- **Idempotent transaction creation** via `Idempotency-Key` header

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)
- Git

### Running with Docker Compose

1. **Clone the repository**

```bash
git clone <repository-url>
cd ilia-nodejs-challenge
```

2. **Create environment file** (optional, has defaults)

```bash
cp .env.example .env
```

3. **Start all services**

```bash
docker compose up -d
```

4. **Access the APIs**

- **Users API**: http://localhost:3002
- **Users Swagger UI**: http://localhost:3002/api-docs
- **Wallet API**: http://localhost:3001
- **Wallet Swagger UI**: http://localhost:3001/api-docs

### Local Development (Hybrid Approach)

This approach uses Docker for databases while running the services locally for faster development iteration.

#### Prerequisites

- **Docker & Docker Compose** - For running PostgreSQL databases
- **Node.js 20+** - For running the services locally
- **Git** - For cloning the repository

#### Setup Steps

**1. Start the PostgreSQL databases using Docker Compose**

```bash
# Start only the database containers
docker compose up -d postgres-users postgres-wallet

# Verify databases are running
docker compose ps
```

This will start:
- `postgres-users` on `localhost:5432`
- `postgres-wallet` on `localhost:5433`

**2. Create environment files for each service**

First, ensure you have a `.env` file in the root directory (or use the defaults from `.env.example`):

```bash
# In the root directory
cp .env.example .env
# Edit .env if you want to change default passwords
```

Then create `.env` files for each microservice:

```bash
# For ms-users
cd ms-users
cp .env.example .env
# Edit .env and update the database password to match your root .env file

# For ms-wallet
cd ../ms-wallet
cp .env.example .env
# Edit .env and update the database password to match your root .env file
```

**Important:** The database passwords in `ms-users/.env` and `ms-wallet/.env` must match the passwords defined in the root `.env` file:
- `ms-users/.env` → `DATABASE_URL` password must match `POSTGRES_USERS_PASSWORD` from root `.env`
- `ms-wallet/.env` → `DATABASE_URL` password must match `POSTGRES_WALLET_PASSWORD` from root `.env`

Also ensure the `JWT_SECRET` and `JWT_SECRET_INTERNAL` values match across all `.env` files.

**3. Setup and run ms-wallet**

```bash
cd ms-wallet
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

The wallet service will be available at: http://localhost:3001

**4. Setup and run ms-users** (in a new terminal)

```bash
cd ms-users
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

The users service will be available at: http://localhost:3002

**5. Verify the setup**

- **Users API**: http://localhost:3002
- **Users Swagger UI**: http://localhost:3002/api-docs
- **Wallet API**: http://localhost:3001
- **Wallet Swagger UI**: http://localhost:3001/api-docs

Test the health endpoints:
```bash
curl http://localhost:3002/health
curl http://localhost:3001/health
```

#### Development Workflow

- Edit code in your IDE
- Changes are automatically reloaded (thanks to `ts-node` and `npm run dev`)
- No need to rebuild Docker images
- Database data persists in Docker volumes

#### Stopping Services

```bash
# Stop the Node.js services: Ctrl+C in each terminal

# Stop the Docker databases (keeps data):
docker compose stop postgres-users postgres-wallet

# Stop and remove databases (deletes data):
docker compose down -v
```

## 📚 API Documentation

### Interactive Documentation

Both services provide interactive Swagger UI documentation:

- **ms-users**: http://localhost:3002/api-docs
- **ms-wallet**: http://localhost:3001/api-docs

### OpenAPI Specifications

- `ms-users/openapi.json` - Users service API spec
- `ms-wallet/openapi.json` - Wallet service API spec

### Quick API Examples

#### Register a User

```bash
curl -X POST http://localhost:3002/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

#### Login

```bash
curl -X POST http://localhost:3002/api/auth \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

#### Create Transaction (Credit)

```bash
curl -X POST http://localhost:3001/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Idempotency-Key: unique-request-id-123" \
  -d '{
    "amount": 100.50,
    "type": "CREDIT"
  }'
```

#### Get Balance

```bash
curl http://localhost:3001/api/balance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🏗️ Technology Stack

### Core

- **Runtime**: Node.js 24
- **Language**: TypeScript
- **Framework**: Express.js 5
- **Database**: PostgreSQL 15
- **ORM**: Prisma

### Security

- **Authentication**: JWT (jsonwebtoken)
- **Password**: bcrypt
- **Headers**: Helmet
- **CORS**: cors

### Resilience

- **Circuit Breaker**: Custom implementation
- **Retry Logic**: Exponential backoff
- **Request Correlation**: X-Request-ID headers
- **Structured Logging**: Morgan with correlation IDs

### Testing

- **Framework**: Jest
- **Coverage**: Unit, Integration, Service, Repository tests
- **API Testing**: Supertest

### DevOps

- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **CI/CD**: GitHub Actions
- **Code Quality**: ESLint, Prettier

## 🧪 Testing

### Run All Tests

```bash
# ms-users
cd ms-users && npm test

# ms-wallet
cd ms-wallet && npm test
```

### Test Coverage

The project includes:

- ✅ **Unit Tests**: Basic health checks
- ✅ **Repository Tests**: Isolated database layer testing
- ✅ **Service Tests**: Business logic with mocked dependencies
- ✅ **Integration Tests**: API endpoint validation

### CI Pipeline

GitHub Actions automatically runs on every push and PR:

- Linting
- Building
- Testing
- Docker image building (on main branch)

## 🔐 Security Features

- **JWT Tokens**: Separate secrets for user and internal service communication
- **Password Hashing**: bcrypt with 12+ rounds
- **Input Validation**: Joi schemas on all endpoints
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing configured
- **Environment Variables**: Sensitive data externalized

## 🌟 Resilience Patterns

### Circuit Breaker

Protects against cascading failures when wallet service is unavailable:

- Threshold: 5 failures
- Reset timeout: 20 seconds
- States: CLOSED → OPEN → HALF_OPEN

### Retry Logic

Automatic retries with exponential backoff:

- Max retries: 3
- Initial delay: 500ms
- Backoff factor: 2x

### Graceful Degradation

User registration succeeds even if wallet creation fails, allowing manual wallet creation later.

### Observability

- Request correlation IDs (X-Request-ID)
- Structured logging with request/response times
- Health check endpoints

## 📁 Project Structure

```
ilia-nodejs-challenge/
├── ms-users/
│   ├── src/
│   │   ├── @types/          # TypeScript type definitions
│   │   ├── controllers/     # Request handlers
│   │   ├── middlewares/     # Express middlewares
│   │   ├── repositories/    # Database access layer
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── tests/           # Test files
│   │   ├── utils/           # Utilities (JWT, password, resilience)
│   │   ├── validations/     # Joi schemas
│   │   ├── app.ts           # Express app setup
│   │   ├── db.ts            # Prisma client
│   │   └── server.ts        # Server entry point
│   ├── prisma/              # Database schema and migrations
│   ├── openapi.json         # API specification
│   └── Dockerfile
├── ms-wallet/
│   ├── src/                 # Similar structure to ms-users
│   ├── prisma/
│   ├── openapi.json
│   └── Dockerfile
├── .github/
│   └── workflows/
│       └── ci.yml           # CI/CD pipeline
├── docker-compose.yml       # Service orchestration
├── ROADMAP.md              # Development roadmap
└── README.md               # This file
```

## 🔄 Database Schema

### ms-users

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  firstName String
  lastName  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### ms-wallet

```prisma
model Wallet {
  id           String        @id @default(uuid())
  user_id      String        @unique
  createdAt    DateTime      @default(now())
  transactions Transaction[]
}

model Transaction {
  id             String   @id @default(uuid())
  amount         Float
  type           String   // CREDIT or DEBIT
  idempotencyKey String?  @unique
  walletId       String
  wallet         Wallet   @relation(fields: [walletId], references: [id])
  createdAt      DateTime @default(now())
}
```

## 🚦 Health Checks

All services and databases have health checks configured:

```bash
# Check users service
curl http://localhost:3002/health

# Check wallet service
curl http://localhost:3001/health
```

Docker Compose uses these for dependency management and automatic restarts.

## 🛠️ Development

### Linting

```bash
npm run lint
npm run lint:fix
```

### Formatting

```bash
npm run format
```

### Building

```bash
npm run build
```

### Database Migrations

```bash
# Create migration
npx prisma migrate dev --name migration_name

# Deploy to production
npx prisma migrate deploy
```

## 📊 Monitoring & Logs

Request logs include correlation IDs for tracking:

```
Request ID | Method | URL | Status | Response Time
```

Example:

```
a1b2c3d4-e5f6-7890-abcd-ef1234567890 POST /api/auth/login 200 45ms
```

## 🤝 Contributing

1. Create a feature branch from `develop`
2. Make your changes
3. Run tests: `npm test`
4. Run linting: `npm run lint`
5. Create a Pull Request

## 📝 License

See LICENSE file for details.

## 👥 Authors

Built for the Ília Banking Platform coding challenge.

## 🔗 Related Documentation

- [ms-users OpenAPI](./ms-users/openapi.json) - Users API specification
- [ms-wallet OpenAPI](./ms-wallet/openapi.json) - Wallet API specification

## 🆘 Troubleshooting

### Port Already in Use

```bash
# Find and kill process using port 3002
lsof -ti:3002 | xargs kill -9

# Find and kill process using port 3001
lsof -ti:3001 | xargs kill -9

# Or change ports in docker-compose.yml or service .env files
```

### Database Connection Issues

**For Docker Compose:**
```bash
# Reset databases
docker compose down -v
docker compose up -d
```

**For Local Development (Hybrid):**
```bash
# Check if databases are running
docker compose ps

# Restart databases
docker compose restart postgres-users postgres-wallet

# Check database logs
docker compose logs postgres-users
docker compose logs postgres-wallet

# Verify connection string in .env files
# Ensure passwords match between root .env and service .env files
```

### Prisma Migration Errors

```bash
# Reset Prisma client and regenerate
cd ms-users  # or ms-wallet
rm -rf node_modules/.prisma
rm -rf src/generated/prisma
npx prisma generate

# If migrations are failing, reset the database
npx prisma migrate reset
npx prisma migrate dev
```

### Environment Variable Issues

**Problem:** Service can't find DATABASE_URL or JWT secrets

**Solution:**
```bash
# Verify .env file exists in the service directory
ls -la ms-users/.env
ls -la ms-wallet/.env

# Check that .env file has all required variables:
# - DATABASE_URL
# - JWT_SECRET
# - JWT_SECRET_INTERNAL
# - PORT
# - WALLET_SERVICE_URL (for ms-users only)

# Ensure passwords in service .env match root .env
cat .env | grep POSTGRES_USERS_PASSWORD
cat ms-users/.env | grep DATABASE_URL
```

### Service-to-Service Communication Issues

**Problem:** ms-users can't communicate with ms-wallet

**Solution:**
```bash
# Verify ms-wallet is running and accessible
curl http://localhost:3001/health

# Check WALLET_SERVICE_URL in ms-users/.env
# For local development it should be: http://localhost:3001
# NOT: http://ms-wallet:3001 (that's for Docker Compose only)
```

### Tests Failing

```bash
# Ensure test environment variables are set
# Check jest.setup.js files in each service

# Run tests with verbose output
npm test -- --verbose

# Clear Jest cache
npm test -- --clearCache
```
