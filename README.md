# Warpmail (AI Personified) 🧠✉️

An intelligent email management platform that leverages AI to understand communication patterns, provide contextual insights, and enhance email composition through personalized analysis.

## 🌟 Features

- **AI-Powered Email Analysis** - Automated annotation and pattern extraction from Gmail threads
- **Contextual Communication Insights** - Builds recipient profiles and communication preferences
- **Semantic Email Search** - Vector-based similarity search using embeddings
- **Style Pattern Recognition** - Analyzes and learns from writing styles and communication patterns
- **Real-time Processing** - Scalable message queue architecture for handling large email volumes
- **Privacy-First Design** - Built-in PII redaction and secure data handling

## 🏗️ Architecture

This is a **Turborepo** monorepo containing:

### Applications

- **`apps/api/`** - NestJS backend API server (port 3000)
- **`apps/web/`** - Next.js frontend application (port 3001)

### Shared Packages

- **`@repo/api`** - Shared NestJS resources and entities
- **`@repo/ui`** - Reusable React components
- **`@repo/eslint-config`** - ESLint configurations with Prettier
- **`@repo/jest-config`** - Jest test configurations
- **`@repo/typescript-config`** - Shared TypeScript configurations

## 🛠️ Tech Stack

### Backend (NestJS API)

- **Runtime**: Node.js with TypeScript
- **Framework**: NestJS with Fastify adapter
- **Database**: Supabase (PostgreSQL) with vector extensions
- **Authentication**: NextAuth.js v5 with Supabase adapter
- **AI/ML**: Azure OpenAI (GPT-4o, text-embedding-3-large), LangChain
- **Message Queue**: Azure Service Bus
- **Cache**: Redis (ioredis)
- **Email Integration**: Gmail API
- **Monitoring**: Sentry

### Frontend (Next.js)

- **Framework**: Next.js 15 with React 19 RC
- **Styling**: Tailwind CSS with Radix UI components
- **State Management**: React Context + SWR
- **Icons**: Lucide React
- **Analytics**: PostHog
- **Type Safety**: Full TypeScript coverage

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18
- Yarn package manager
- PostgreSQL database (or Supabase account)
- Redis instance
- Gmail API credentials
- Azure OpenAI API key
- Azure Service Bus connection string

### Environment Setup

1. **Clone the repository**

```bash
git clone https://github.com/your-username/warpmail.git
cd warpmail
```

2. **Install dependencies**

```bash
yarn install
```

3. **Configure environment variables**

Copy the example environment files and fill in your credentials:

```bash
# API environment
cp apps/api/.env.example apps/api/.env.local

# Web environment
cp apps/web/.env.example apps/web/.env.local
```

See [Environment Configuration](#-environment-configuration) for detailed setup instructions.

4. **Start development servers**

```bash
# Start both API and web applications
yarn dev

# Or start individually
yarn dev:api  # API server on http://localhost:3000
yarn dev:web  # Web app on http://localhost:3001
```

## 📋 Available Commands

### Development

```bash
yarn dev          # Start all applications in development mode
yarn dev:api      # Start only the API server
yarn dev:web      # Start only the web application
```

### Building

```bash
yarn build        # Build all applications and packages
yarn build:api    # Build only the API
yarn build:web    # Build only the web app
```

### Testing

```bash
yarn test         # Run unit tests across all packages
yarn test:api     # Run API unit tests
yarn test:web     # Run web unit tests
yarn test:e2e     # Run end-to-end tests
```

### Code Quality

```bash
yarn lint         # Lint all code
yarn format       # Format all code with Prettier
yarn typecheck    # Run TypeScript type checking
```

## ⚙️ Environment Configuration

### Required Environment Variables

#### Database & Auth

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your_nextauth_secret
```

#### Google Services

```env
# Gmail API
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

#### AI & Analytics

```env
# Azure OpenAI
AZURE_RESOURCE_NAME=your_azure_resource_name
AZURE_API_KEY=your_azure_api_key

# LangChain (optional, for tracing)
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=warpmail
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
LANGCHAIN_API_KEY=your_langchain_api_key

# PostHog Analytics (optional)
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

#### Infrastructure

```env
# Redis Cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Azure Service Bus
SERVICEBUS_CONNECTION_STRING=your_servicebus_connection_string
```

#### Application Settings

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3001
NEXT_PUBLIC_CONTACTS_ENABLED=true
```

## 🏛️ Core Services

### AgentsService

Orchestrates AI-powered email analysis using Azure OpenAI to:

- Extract insights and annotations from email threads
- Analyze communication patterns and writing styles
- Redact PII and ensure data privacy
- Store structured annotations in the database

### ContextService

Builds comprehensive communication context profiles by:

- Analyzing historical interactions with recipients
- Generating semantic embeddings for context matching
- Calculating communication success metrics
- Providing contextual insights for email composition

### EmbeddingsService

Processes email content for semantic understanding:

- Creates vector embeddings using Azure OpenAI
- Extracts detailed communication style patterns
- Enables semantic search and similarity matching
- Implements rate limiting and retry logic

### ReceiverService

Manages scalable email processing pipeline:

- Processes messages from Azure Service Bus queue
- Orchestrates Gmail API interactions
- Implements batch processing and concurrency control
- Handles errors gracefully with retry mechanisms

## 🔐 Privacy & Security

- **PII Redaction**: Automatic removal of sensitive information before AI processing
- **Secure Authentication**: OAuth2 integration with Google services
- **Data Encryption**: All data encrypted at rest and in transit
- **Access Control**: Role-based permissions and API security
- **Monitoring**: Comprehensive error tracking and performance monitoring

## 🧪 Testing

The project includes comprehensive testing setup:

- **Unit Tests**: Jest with React Testing Library
- **Integration Tests**: API endpoint testing with Supertest
- **E2E Tests**: Playwright for end-to-end user flows
- **Type Safety**: Full TypeScript coverage with strict mode

Run tests with:

```bash
yarn test        # All unit tests
yarn test:e2e    # End-to-end tests
yarn test:api    # API-specific tests
yarn test:web    # Web-specific tests
```

## 📦 Deployment

### Production Build

```bash
yarn build
```

### Docker Support

Docker configurations are available for containerized deployments:

```bash
# Build and run with Docker Compose
docker-compose up --build
```

### Environment-Specific Configs

- Development: `.env.local`
- Staging: `.env.staging`
- Production: `.env.production`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style (enforced by ESLint/Prettier)
- Add tests for new functionality
- Update documentation as needed
- Use conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Useful Links

- [NestJS Documentation](https://nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Turborepo Documentation](https://turborepo.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Azure OpenAI Documentation](https://learn.microsoft.com/en-us/azure/cognitive-services/openai/)

---

**Built with ❤️ using modern TypeScript, AI, and cloud technologies.**
