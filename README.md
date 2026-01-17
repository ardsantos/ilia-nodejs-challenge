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
docker-compose up -d
```

4. **Access the APIs**
- **Users API**: http://localhost:3002
- **Users Swagger UI**: http://localhost:3002/api-docs
- **Wallet API**: http://localhost:3001
- **Wallet Swagger UI**: http://localhost:3001/api-docs

### Local Development

#### ms-users
```bash
cd ms-users
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

#### ms-wallet
```bash
cd ms-wallet
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
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
  id        String   @id @default(uuid())
  amount    Float
  type      String   // CREDIT or DEBIT
  walletId  String
  wallet    Wallet   @relation(fields: [walletId], references: [id])
  createdAt DateTime @default(now())
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

- [ROADMAP.md](./ROADMAP.md) - Project development phases
- [ms-users OpenAPI](./ms-users/openapi.json) - Users API specification
- [ms-wallet OpenAPI](./ms-wallet/openapi.json) - Wallet API specification

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Find and kill process using port 3002
lsof -ti:3002 | xargs kill -9

# Or change ports in docker-compose.yml
```

### Database Connection Issues
```bash
# Reset databases
docker-compose down -v
docker-compose up -d
```

### Tests Failing
```bash
# Ensure test environment variables are set
# Check jest.setup.js files in each service
```
