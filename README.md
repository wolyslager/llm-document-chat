# LLM Document Chat

A Next.js application for document processing, analysis, and chat using OpenAI's Vision API and vector stores. Upload documents (PDFs, images, text files), extract structured data, and perform semantic search across your document collection.

## Features

- **Document Upload & Processing**: Support for PDFs, images, Word docs, and text files
- **AI-Powered Extraction**: Uses OpenAI Vision API to extract tables and text from documents
- **Vector Search**: Semantic search across document content using OpenAI vector stores
- **Real-time Progress**: SSE-based progress tracking for document processing
- **Structured Logging**: Comprehensive logging with pino for debugging and monitoring
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

- `POST /api/upload` - Upload and process documents
- `POST /api/search` - Search across document content
- `GET /api/documents` - List processed documents
- `GET /api/documents/[id]` - Get specific document details
- `DELETE /api/documents/[id]` - Delete a document
- `GET /api/vector-stores` - List vector stores
- `POST /api/vector-stores` - Create new vector store

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler
- `./scripts/cleanup-all.js` - Clean database and vector stores
- `./scripts/cleanup-database.js` - Clean database only
- `./scripts/cleanup-vector-store.js` - Clean vector store only

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
