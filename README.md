# AutoCRM

AutoCRM is an AI-powered Customer Relationship Management system designed to minimize manual support workload while enhancing customer experience. The system leverages generative AI to provide interactive support and sales experiences, integrating existing help resources with Large Language Models (LLMs).

## Tech Stack

### Frontend
- **React** with TypeScript
- **Vite** as the build tool
- Modern UI components with accessibility in mind

### Backend (Supabase)
- **PostgreSQL** database (managed by Supabase)
- Built-in authentication flows (email/password, social SSO)
- Storage for attachments and file uploads
- Edge Functions (Deno-based serverless environment)

### Deployment
- **AWS Amplify 2.0** for deployment and hosting

## Core Features

### Data Management
- Ticket tracking system with history
- Dynamic custom fields
- Comprehensive audit logging
- Schema management for custom fields

### Database Structure
- `tickets` table for core ticket data
- `ticket_history` for change tracking
- `schema_definitions` for custom field metadata
- `audit_logs` for system-wide action tracking

## Testing

### Testing Stack
- **Unit/Integration Tests**: Vitest + React Testing Library
- **Coverage Reports**: V8 coverage provider

### Test Types
- Unit tests for individual components
- Integration tests for component interactions
- Edge case testing for robust functionality

### Running Tests
```bash
npm test              # Run unit tests
npm run test:coverage # Run tests with coverage report
```

## Project Structure
```
/src
├─ /components        # React components
├─ /lib              # Utility functions and configurations
├─ /types            # TypeScript type definitions
├─ /test             # Test files
│   ├─ setup.ts      # Test configuration
│   └─ /components   # Component-specific tests
└─ App.tsx           # Main application entry
```

## Development Guidelines
1. All type definitions should be in the `/types` directory
2. Common types go in `/types/common.ts`
3. Domain-specific types should be organized by domain
4. Run `npm run build` after implementations to verify changes

## Getting Started

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Set up environment variables (see `.env.example`)
4. Start the development server:
```bash
npm run dev
```

## Testing Guidelines
1. Tests should be isolated and clean up after themselves
2. Aim for 80% coverage of business logic
3. Keep tests focused and descriptive
4. Group related tests to optimize performance
