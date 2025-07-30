# Document Processor API Documentation

This API provides endpoints for document upload, processing, search, and management.

## Base URL
```
http://localhost:3000/api
```

## Endpoints

### 1. Upload Document
Upload and process a document for content extraction and search indexing.

**Endpoint:** `POST /upload`  
**Content-Type:** `multipart/form-data`

**Parameters:**
- `file` (required): Document file (PDF, PNG, JPG, TXT, DOC, DOCX)
- Maximum file size: 10MB

**Example:**
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/path/to/document.pdf"
```

**Response:**
```json
{
  "message": "File uploaded successfully",
  "originalName": "document.pdf",
  "size": 123456,
  "type": "application/pdf",
  "uploadedAt": "2024-01-15T10:30:00.000Z",
  "processing": {
    "method": "direct-vision-api",
    "originalType": "application/pdf"
  },
  "extraction": {
    "tables": [
      {"row": "Header", "column": "Name", "value": "John Doe"},
      {"row": "Header", "column": "Age", "value": "30"}
    ],
    "rawText": "Extracted document content...",
    "rawResponse": {...}
  },
  "documentId": "clxy1234567890abcdef",
  "vectorStore": {
    "vectorStoreId": "vs_1234567890abcdef",
    "vectorStoreFileId": "file_1234567890abcdef",
    "extractedFileId": "file_extracted_123456",
    "status": "completed"
  }
}
```

**Error Response:**
```json
{
  "error": "File size exceeds 10MB limit"
}
```

---

### 2. List All Documents
Retrieve a list of all uploaded and processed documents.

**Endpoint:** `GET /documents`

**Example:**
```bash
curl http://localhost:3000/api/documents
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "documents": [
    {
      "id": "clxy1234567890abcdef",
      "fileId": "direct-processing-abc123",
      "filename": "document.pdf", 
      "originalName": "document.pdf",
      "fileSize": 123456,
      "fileType": "application/pdf",
      "uploadedAt": "2024-01-15T10:30:00.000Z",
      "processingTimeMs": 15000,
      "status": "success",
      "extractedData": {
        "tablesCount": 15,
        "textLength": 450,
        "hasContent": true
      },
      "vectorStoreId": "vs_1234567890abcdef",
      "vectorStoreFileId": "file_1234567890abcdef",
      "extractedFileId": "file_extracted_123456"
    }
  ]
}
```

**Error Response:**
```json
{
  "error": "Failed to fetch documents"
}
```

---

### 3. Get Single Document
Retrieve detailed information about a specific document.

**Endpoint:** `GET /documents/{id}`

**Parameters:**
- `id` (required): Document ID

**Example:**
```bash
curl http://localhost:3000/api/documents/clxy1234567890abcdef
```

**Response:**
```json
{
  "success": true,
  "document": {
    "id": "clxy1234567890abcdef",
    "filename": "document.pdf",
    "originalName": "document.pdf",
    "fileSize": 123456,
    "fileType": "application/pdf",
    "uploadedAt": "2024-01-15T10:30:00.000Z",
    "processingTimeMs": 15000,
    "status": "success",
    "extractedContent": {
      "tables": [
        {"row": "Header", "column": "Name", "value": "John Doe"},
        {"row": "Header", "column": "Age", "value": "30"}
      ],
      "rawText": "Complete extracted document content...",
      "rawResponse": {
        "pages": 1,
        "responses": [...]
      }
    },
    "vectorStoreId": "vs_1234567890abcdef",
    "vectorStoreFileId": "file_1234567890abcdef",
    "extractedFileId": "file_extracted_123456"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Document not found",
  "id": "clxy1234567890abcdef"
}
```

---

### 4. Search Documents
Search across all uploaded documents using natural language queries.

**Endpoint:** `POST /search`  
**Content-Type:** `application/json`

**Parameters:**
- `query` (required): Search query string

**Example:**
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the total amount in the invoice?"}'
```

**Response:**
```json
{
  "success": true,
  "query": "What is the total amount in the invoice?",
  "response": "The total amount in the invoice is $1,234.56.",
  "metadata": {
    "runId": "run_1234567890abcdef",
    "threadId": "thread_1234567890abcdef",
    "searchedAt": "2024-01-15T10:35:00.000Z"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Search query is required",
  "query": ""
}
```

---

## Status Codes

- `200 OK` - Request successful
- `400 Bad Request` - Invalid request parameters
- `404 Not Found` - Document not found
- `500 Internal Server Error` - Server error

## File Types Supported

- **PDF**: `.pdf` files
- **Images**: `.png`, `.jpg`, `.jpeg`
- **Documents**: `.doc`, `.docx` 
- **Text**: `.txt`

## Rate Limits

No rate limits currently implemented.

## Authentication

No authentication required.

## Examples

### Complete Workflow Example

1. **Upload a document:**
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@invoice.pdf"
```

2. **List all documents:**
```bash
curl http://localhost:3000/api/documents
```

3. **Get specific document details:**
```bash
curl http://localhost:3000/api/documents/clxy1234567890abcdef
```

4. **Search across documents:**
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Find all invoices with amounts over $1000"}'
```

## Error Handling

All endpoints return structured error responses with:
- `error`: Human-readable error message
- `success`: Boolean indicating success/failure
- Additional context fields where applicable

## Notes

- Documents are processed using OpenAI's vision API for content extraction
- Extracted content is automatically indexed for search
- Duplicate files (same filename) will be rejected
- Failed uploads are not stored in the database
- Search uses semantic similarity across all processed documents