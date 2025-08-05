# Contributing to Warpmail (AI Personified) 🤝

Thank you for your interest in contributing to Warpmail! This document provides guidelines and information for contributors.

## 🌟 Ways to Contribute

- **Bug Reports**: Help us identify and fix issues
- **Feature Requests**: Suggest new features or improvements
- **Code Contributions**: Submit bug fixes, new features, or improvements
- **Documentation**: Improve docs, examples, and tutorials
- **Testing**: Add test cases and improve test coverage
- **Community**: Help other users, answer questions, share knowledge

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:

- Node.js >= 18
- Yarn package manager
- Git configured with your name and email
- A Supabase account (for database)
- Azure OpenAI API access
- Basic understanding of TypeScript, NestJS, and Next.js

### Setting up the Development Environment

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/warpmail.git
cd warpmail
   ```

2. **Install Dependencies**
   ```bash
   yarn install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment examples
   cp apps/api/.env.example apps/api/.env.local
   cp apps/web/.env.example apps/web/.env.local
   
   # Fill in your actual credentials
   ```

4. **Start Development Servers**
   ```bash
   yarn dev
   ```

## 📋 Development Workflow

### Branch Naming Convention

Use descriptive branch names:
- `feature/add-email-templates`
- `fix/context-service-memory-leak`
- `docs/update-api-documentation`
- `refactor/improve-error-handling`

### Commit Message Guidelines

Follow conventional commits format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(api): add email template management endpoints
fix(embeddings): resolve memory leak in batch processing
docs(readme): update environment setup instructions
refactor(agents): improve error handling in AI service
```

### Code Style Guidelines

- Use TypeScript strict mode
- Follow ESLint and Prettier configurations
- Add JSDoc comments for public methods and classes
- Use meaningful variable and function names
- Keep functions small and focused
- Handle errors gracefully with proper logging

### Testing Requirements

- Write unit tests for new features
- Ensure existing tests pass
- Add integration tests for API endpoints
- Include E2E tests for critical user flows
- Aim for >80% test coverage

```bash
# Run tests
yarn test

# Run with coverage
yarn test:cov

# Run E2E tests
yarn test:e2e
```

## 🔧 Code Architecture

### Project Structure

```
apps/
├── api/          # NestJS backend
│   ├── src/
│   │   ├── agents/       # AI analysis service
│   │   ├── context/      # Communication context
│   │   ├── embeddings/   # Vector embeddings
│   │   ├── receiver/     # Message queue processing
│   │   └── common/       # Shared utilities
│   └── test/
└── web/          # Next.js frontend
    ├── src/
    │   ├── app/          # Next.js App Router
    │   ├── components/   # React components
    │   └── lib/          # Client utilities
    └── test/
```

### Key Services

- **AgentsService**: AI-powered email analysis
- **ContextService**: Communication pattern analysis
- **EmbeddingsService**: Vector embeddings processing
- **ReceiverService**: Message queue orchestration

### Design Principles

1. **Modularity**: Each service has a specific responsibility
2. **Type Safety**: Comprehensive TypeScript coverage
3. **Error Resilience**: Graceful error handling and retry logic
4. **Performance**: Efficient batch processing and caching
5. **Privacy**: PII redaction and secure data handling

## 🐛 Reporting Bugs

When reporting bugs, please include:

1. **Clear Description**: What happened vs. what you expected
2. **Steps to Reproduce**: Detailed steps to recreate the issue
3. **Environment Info**: OS, Node.js version, browser, etc.
4. **Error Messages**: Full error messages and stack traces
5. **Screenshots**: If applicable, include screenshots
6. **Code Samples**: Minimal code example that reproduces the issue

Use the bug report template when creating issues.

## 💡 Feature Requests

For feature requests, please provide:

1. **Use Case**: Why is this feature needed?
2. **Detailed Description**: How should it work?
3. **Acceptance Criteria**: What defines success?
4. **Alternatives Considered**: Other solutions you've thought about
5. **Implementation Ideas**: Technical approach (if you have one)

## 📝 Pull Request Process

1. **Create an Issue**: Discuss the change before implementing
2. **Fork and Branch**: Create a feature branch from `main`
3. **Implement Changes**: Follow code style and testing guidelines
4. **Test Thoroughly**: Ensure all tests pass
5. **Update Documentation**: Update relevant docs and examples
6. **Submit PR**: Use the PR template and link to related issues

### PR Checklist

- [ ] Tests pass locally (`yarn test`)
- [ ] Code follows style guidelines (`yarn lint`)
- [ ] Documentation updated (if needed)
- [ ] Breaking changes documented
- [ ] Commit messages follow convention
- [ ] PR description explains changes clearly

## 🔐 Security Guidelines

- Never commit credentials or API keys
- Use environment variables for sensitive data
- Follow secure coding practices
- Report security vulnerabilities privately
- Validate all user inputs
- Implement proper authentication and authorization

## 📚 Documentation Standards

- Use clear, concise language
- Include code examples where helpful
- Document all public APIs
- Keep README files up to date
- Add JSDoc comments to TypeScript code
- Include setup and troubleshooting guides

## 🤔 Questions and Support

- **GitHub Discussions**: For general questions and discussions
- **GitHub Issues**: For bug reports and feature requests
- **Discord**: Join our community chat (link in README)
- **Email**: Contact maintainers directly for security issues

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be recognized in:
- README contributors section
- Release notes for significant contributions
- GitHub contributors graph
- Community highlights

---

Thank you for helping make Warpmail better! Every contribution, no matter how small, is valuable and appreciated. 🎉