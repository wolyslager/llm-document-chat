# Gently Take-Home: LLM-Powered Data Extraction & Summarization

## Project Overview
Building a service that lets users upload documents, automatically classify document types (purchase orders, invoices, etc.), and extract key structured data using an LLM. The extracted data is stored in a database and accessible via retrieval APIs.

## Tech Stack Requirements
- TypeScript
- Node.js
- Express (Updated: Using Next.js instead)
- Postgres

## Requirements
1. **Document Upload**: File upload mechanism
2. **Classification & Extraction**: Use LLM to determine document type and extract relevant fields
3. **Storage**: Save extracted data in database
4. **Retrieval APIs**: 
   - Fetch list of uploaded documents
   - Fetch document with all relevant information
   - Basic search across documents
   - Ask generic questions about documents

## Implementation Plan
Working on this piece by piece:
1. **Module 1**: Simple UI with document uploader (current focus)
2. **Module 2**: LLM integration for classification and extraction
3. **Module 3**: Database storage
4. **Module 4**: Retrieval APIs

## Notes
- Focus on core problem solving within reasonable time
- Clean, well-structured code following best practices
- Include tests for key parts
- Simple frontend to showcase solution (bare-bones UI acceptable)
- Skip authentication/user models for now
- Using Next.js for full-stack development instead of Express