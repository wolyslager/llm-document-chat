# LLM Document Chat

**Take-Home Project: LLM-Powered Data Extraction & Summarization**

A Next.js service that lets users upload documents, automatically classifies document types (invoices, purchase orders, receipts, etc.), and extracts key structured data using OpenAI's Vision API. The extracted data is stored in a database and accessible via retrieval APIs.

## Features

### Core Requirements ✅
- **Document Upload**: File upload mechanism supporting PDFs, images, text files, and CSV
- **Document Classification**: Automatically classifies documents as invoices, purchase orders, receipts, contracts, reports, forms, letters, or other
- **Structured Data Extraction**: Extracts relevant fields based on document type:
  - **Invoices**: Invoice number, date, vendor, total, tax, bill-to information, line items
  - **Purchase Orders**: PO number, date, vendor, buyer, total, items, delivery date, terms
  - **Receipts**: Store, date, total, tax, payment method, items
  - **Contracts**: Parties, date, title, value, terms, duration
- **Database Storage**: All extracted data saved to SQLite database with Prisma ORM
- **Retrieval APIs**: Complete set of endpoints for document management and search

### Additional Features
- **Vector Search**: Semantic search across document content using OpenAI vector stores
- **Real-time Progress**: SSE-based progress tracking for document processing
- **Structured Logging**: Comprehensive logging with Pino for debugging and monitoring
- **Type Safety**: Full TypeScript implementation with Zod validation
- **Testing**: Jest test suite with API route coverage

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key
- (Optional) Poppler tools for PDF processing (`pdftocairo`)
- (Optional) Redis/Upstash for caching

### Setup

1. Clone the repository:
```bash
git clone https://github.com/wolyslager/llm-document-chat.git
cd llm-document-chat
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env.local
# Edit .env.local with your OpenAI API key and other settings
```

4. Set up the database:
```bash
npx prisma migrate dev --name init
```

5. Create a vector store:
```bash
node setup-vector-store.js
```

6. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

- `src/app/api/` - Next.js API routes for document upload, search, and management
- `src/lib/` - Core utilities (OpenAI, database, logging, validation)
- `src/components/` - React components for the UI
- `scripts/` - Utility scripts for cleanup and setup
- `prisma/` - Database schema and migrations
- `src/__tests__/` - Jest test suite

## API Routes

### Document Processing
- `POST /api/upload` - Upload documents for classification and data extraction

### Retrieval APIs (Core Requirement)
- `GET /api/documents` - **Fetch list of uploaded documents** with metadata and extracted data summaries
- `GET /api/documents/[id]` - **Fetch document with all relevant information** including full extracted data
- `POST /api/search` - **Basic search across documents** using semantic vector search
- `POST /api/search` - **Ask generic questions about documents** via natural language queries

### Vector Store Management
- `GET /api/vector-stores` - List available vector stores
- `POST /api/vector-stores` - Create new vector store
- `DELETE /api/documents/[id]` - Remove documents and clean up associated data

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler
- `./scripts/cleanup-all.js` - Clean database and vector stores
- `./scripts/cleanup-database.js` - Clean database only
- `./scripts/cleanup-vector-store.js` - Clean vector store only

## Implementation Approach

This solution demonstrates **clean, well-structured code following best practices** as requested:

1. **Modular Architecture**: Separation of concerns with dedicated modules for database, OpenAI integration, validation, and error handling
2. **Type Safety**: Full TypeScript implementation with Zod schemas for runtime validation
3. **Error Handling**: Unified error handling with structured JSON responses and proper HTTP status codes
4. **Testing**: Comprehensive Jest test suite covering API routes and core functionality
5. **Logging**: Structured logging with Pino for debugging and monitoring
6. **Code Quality**: ESLint configuration and consistent coding patterns

## Technologies

- **Framework**: Next.js 14 with App Router
- **Database**: SQLite with Prisma ORM
- **AI/ML**: OpenAI GPT-4 Vision API, Vector Stores, Assistants API
- **Validation**: Zod schemas
- **Logging**: Pino structured logging
- **Testing**: Jest with API route testing
- **Styling**: Tailwind CSS
- **TypeScript**: Full type safety throughout

## License

MIT