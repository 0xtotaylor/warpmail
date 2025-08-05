# Warpmail API 🚀

The NestJS backend API for the Warpmail AI-powered email management platform.

## Overview

This API provides intelligent email processing capabilities including:
- AI-powered email analysis and annotation
- Vector-based semantic search
- Communication pattern recognition
- Real-time message queue processing
- Gmail integration with OAuth2

## 🏗️ Architecture

### Core Services

#### 🤖 AgentsService
- **Purpose**: AI-powered email analysis and annotation
- **Features**: 
  - GPT-4o integration for email insights
  - PII redaction for privacy
  - Communication pattern extraction
  - Structured data validation

#### 🧠 ContextService  
- **Purpose**: Communication context building
- **Features**:
  - Recipient profile analysis
  - Historical interaction patterns
  - Success metrics calculation
  - Contextual email insights

#### 🔍 EmbeddingsService
- **Purpose**: Vector embeddings and semantic search
- **Features**:
  - Text embedding generation
  - Style pattern extraction
  - Similarity matching
  - Rate limiting with exponential backoff

#### 📨 ReceiverService
- **Purpose**: Scalable email processing pipeline
- **Features**:
  - Azure Service Bus integration
  - Batch processing optimization
  - Concurrency control
  - Error handling and retries

### Data Flow

```
Azure Service Bus → ReceiverService → Gmail API
                         ↓
                   AgentsService (AI Analysis)
                         ↓
                   EmbeddingsService (Vector Processing)
                         ↓
                   ContextService (Context Building)
                         ↓
                   Supabase Database
```

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: NestJS with Fastify adapter
- **Database**: Supabase (PostgreSQL with pgvector)
- **AI/ML**: Azure OpenAI (GPT-4o, text-embedding-3-large)
- **Message Queue**: Azure Service Bus
- **Cache**: Redis
- **Email**: Gmail API
- **Monitoring**: Sentry
- **Testing**: Jest + Supertest

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18
- Yarn package manager
- Supabase database with vector extensions
- Redis instance
- Azure OpenAI service
- Azure Service Bus namespace
- Gmail API credentials

### Installation

```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Build for production
yarn build

# Start production server
yarn start:prod
```

### Environment Configuration

Create `.env.local` from `.env.example`:

```env
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret

# Azure Services
AZURE_RESOURCE_NAME=your_azure_resource_name
AZURE_API_KEY=your_azure_api_key
SERVICEBUS_CONNECTION_STRING=your_servicebus_connection_string

# Google Services
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# LangChain (optional)
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=warpmail-api
LANGCHAIN_API_KEY=your_langchain_api_key
```

## 📡 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Gmail OAuth login
- `POST /api/v1/auth/refresh` - Refresh access token

### Gmail Integration
- `GET /api/v1/gmail/messages` - Fetch Gmail messages
- `GET /api/v1/gmail/threads/:id` - Get thread details
- `POST /api/v1/gmail/analyze` - Trigger AI analysis

### Context & Insights
- `GET /api/v1/context/:recipientId` - Get communication context
- `GET /api/v1/annotations/:threadId` - Get thread annotations
- `POST /api/v1/embeddings/search` - Semantic search

## 🧪 Testing

```bash
# Unit tests
yarn test

# E2E tests
yarn test:e2e

# Test coverage
yarn test:cov

# Watch mode
yarn test:watch
```

## 🔧 Development

### Code Structure
```
src/
├── agents/           # AI analysis service
├── context/          # Communication context service
├── embeddings/       # Vector embeddings service
├── receiver/         # Message queue processing
├── common/
│   ├── interfaces/   # TypeScript interfaces
│   └── utils/        # Utility functions
├── config/           # Configuration services
└── main.ts          # Application bootstrap
```

### Key Features

#### Rate Limiting
- Exponential backoff for API calls
- Configurable retry attempts
- Request queuing and throttling

#### Error Handling
- Comprehensive error logging
- Graceful degradation
- Dead letter queue processing

#### Performance
- Batch processing for efficiency
- Concurrent request limiting
- Memory-efficient operations
- Redis caching layer

#### Security
- PII redaction before AI processing
- JWT token validation
- API rate limiting
- Input sanitization

## 📊 Monitoring & Logging

- **Sentry Integration**: Error tracking and performance monitoring
- **Structured Logging**: JSON-formatted logs with correlation IDs
- **Health Checks**: Database and service connectivity monitoring
- **Metrics**: Custom business metrics and performance counters

## 🚀 Deployment

### Docker
```bash
# Build image
docker build -t warpmail-api .

# Run container
docker run -p 3000:3000 warpmail-api
```

### Production Configuration
- Set `NODE_ENV=production`
- Configure proper logging levels
- Enable SSL/TLS termination
- Set up health check endpoints
- Configure monitoring and alerting

## 🔐 Security Considerations

- OAuth2 flow for Gmail access
- Service account authentication for internal services
- API key rotation procedures
- PII detection and redaction
- Secure environment variable handling

## 📚 Additional Resources

- [NestJS Documentation](https://nestjs.com/)
- [Azure OpenAI Service](https://azure.microsoft.com/products/cognitive-services/openai-service/)
- [Gmail API Reference](https://developers.google.com/gmail/api)
- [Supabase Documentation](https://supabase.com/docs)

---

For more information, see the main [project README](../../README.md).