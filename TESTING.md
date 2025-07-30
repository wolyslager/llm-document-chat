# Testing Guide

This document explains how to run and understand the test suite for the Document Processor application.

## Quick Start

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

The test suite is organized into the following categories:

### 📁 Directory Structure
```
src/__tests__/
├── api/                 # API endpoint tests
│   ├── documents.test.ts
│   └── search.test.ts
├── lib/                 # Utility function tests
│   ├── database.test.ts
│   └── openai.test.ts
└── components/          # Component tests (future)
```

## Test Categories

### 🔌 API Endpoint Tests (`src/__tests__/api/`)

**Documents API (`documents.test.ts`)**
- ✅ `GET /api/documents` - List all documents
- ✅ `GET /api/documents/[id]` - Get single document
- ✅ Error handling (404, 500)
- ✅ Response format validation
- ✅ Database integration

**Search API (`search.test.ts`)**
- ✅ `POST /api/search` - Search documents
- ✅ Query validation (empty, missing, wrong type)
- ✅ Citation bracket removal
- ✅ Error handling
- ✅ Response format validation

### 📚 Library Function Tests (`src/__tests__/lib/`)

**Database Functions (`database.test.ts`)**
- ✅ `saveDocument()` - Save document to database
- ✅ `findDocumentByName()` - Find document by name
- ✅ `getAllDocuments()` - Get all documents
- ✅ Error handling and edge cases
- ✅ Optional field handling

**OpenAI Utilities (`openai.test.ts`)**
- ✅ `getFileType()` - File type detection
- ✅ `extractTablesAndText()` - Content extraction
- ✅ Text file processing
- ✅ Image file processing
- ✅ Custom prompt handling
- ✅ Error handling

## Running Tests

### Basic Commands

```bash
# Run all tests once
npm test

# Run tests and keep watching for changes
npm run test:watch

# Run with coverage report
npm run test:coverage
```

### Advanced Jest Options

```bash
# Run specific test file
npm test documents.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="should return 404"

# Run tests in specific directory
npm test src/__tests__/api

# Run tests with verbose output
npm test -- --verbose

# Update snapshots (if using snapshot testing)
npm test -- --updateSnapshot
```

## Test Configuration

### Environment Setup
Tests use mocked versions of:
- **OpenAI API** - No real API calls are made
- **Database** - Prisma client is mocked
- **File System** - File operations are mocked
- **External APIs** - All external dependencies are mocked
- **Logging** - Pino logger runs in silent mode during tests

### Environment Variables
Test environment automatically sets:
```bash
OPENAI_API_KEY=test-api-key
DEFAULT_VECTOR_STORE_ID=test-vector-store-id
DATABASE_URL=file:./test.db
UPSTASH_REDIS_REST_URL=http://test-redis-url
UPSTASH_REDIS_REST_TOKEN=test-redis-token
NODE_ENV=test
```

## Coverage Reports

When running `npm run test:coverage`, you'll get a detailed report showing:

```bash
File                    | % Stmts | % Branch | % Funcs | % Lines
------------------------|---------|----------|---------|--------
All files              |   85.5   |   78.2   |   90.1  |   84.8
 api/documents         |   92.3   |   85.7   |  100.0  |   91.2
 api/search            |   88.9   |   75.0   |  100.0  |   87.5
 lib/database          |   95.2   |   88.9   |  100.0  |   94.7
 lib/openai            |   78.4   |   65.4   |   83.3  |   77.9
```

Coverage files are generated in the `coverage/` directory:
- `coverage/lcov-report/index.html` - HTML coverage report
- `coverage/lcov.info` - LCOV format for CI/CD tools

## Writing New Tests

### Test File Naming
- Test files should end with `.test.ts` or `.test.js`
- Place tests in `src/__tests__/` directory
- Mirror the source code structure

### Basic Test Template
```typescript
import { functionToTest } from '@/path/to/module'

// Mock external dependencies
jest.mock('@/external/dependency')

describe('Module Name', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('functionToTest', () => {
    it('should do something successfully', async () => {
      // Arrange
      const input = 'test input'
      
      // Act
      const result = await functionToTest(input)
      
      // Assert
      expect(result).toBe('expected output')
    })

    it('should handle errors gracefully', async () => {
      // Test error cases
      await expect(functionToTest(null)).rejects.toThrow('Error message')
    })
  })
})
```

### Mocking Guidelines

**Database Mocking:**
```typescript
// Mock Prisma Client at the source
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    document: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn()
    }
  }))
}))
```

**OpenAI API Mocking:**
```typescript
jest.mock('@/lib/openai', () => ({
  searchVectorStore: jest.fn(),
  extractTablesAndText: jest.fn()
}))
```

**Logging in Tests:**
The logger automatically runs in silent mode when `NODE_ENV=test`. No console mocking is needed as the application uses structured logging with Pino.

## Continuous Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
```

## Common Issues & Solutions

### Issue: "Cannot find module '@/...'"
**Solution:** Ensure `jest.config.js` has correct path mapping:
```javascript
moduleNameMapping: {
  '^@/(.*)$': '<rootDir>/src/$1',
}
```

### Issue: "ReferenceError: fetch is not defined"
**Solution:** Add to `jest.setup.js`:
```javascript
global.fetch = require('node-fetch')
```

### Issue: Tests timing out
**Solution:** Increase timeout in `jest.setup.js`:
```javascript
jest.setTimeout(30000) // 30 seconds
```

### Issue: Database connection errors
**Solution:** Ensure database is properly mocked:
```typescript
jest.mock('@/lib/database')
```

## Best Practices

### ✅ Do's
- **Mock external dependencies** (APIs, databases, file system)
- **Test both success and error cases**
- **Use descriptive test names** that explain what's being tested
- **Keep tests isolated** - each test should be independent
- **Test the public interface** - focus on what the function does, not how
- **Use arrange-act-assert pattern**

### ❌ Don'ts
- **Don't make real API calls** in tests
- **Don't test implementation details** - test behavior
- **Don't write overly complex tests** - keep them simple and focused
- **Don't skip error case testing**
- **Don't ignore failing tests** - fix them immediately

## Performance Testing

For performance-critical functions, you can add timing assertions:

```typescript
it('should process large files quickly', async () => {
  const start = Date.now()
  await processLargeFile(mockData)
  const duration = Date.now() - start
  
  expect(duration).toBeLessThan(5000) // Should complete in under 5 seconds
})
```

## Integration Testing

While these are unit tests, you can also write integration tests:

```typescript
// Integration test example
it('should complete full upload workflow', async () => {
  // Test the entire flow from API to database
  const mockFile = createMockFile()
  const response = await uploadEndpoint(mockFile)
  
  expect(response.status).toBe(200)
  expect(mockDatabase.create).toHaveBeenCalled()
})
```

## Debugging Tests

### Using Node.js Debugger
```bash
# Run with debugger
node --inspect-brk node_modules/.bin/jest --runInBand

# Then open Chrome DevTools at chrome://inspect
```

### Console Debugging
```typescript
it('should debug test', () => {
  console.log('Debug info:', someValue)
  // Test continues...
})
```

### VSCode Debugging
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Tests",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "cwd": "${workspaceFolder}",
  "console": "integratedTerminal"
}
```

---

## Summary

This test suite provides comprehensive coverage of the critical application components:

- ✅ **API Endpoints** - All HTTP routes tested
- ✅ **Database Operations** - CRUD operations verified
- ✅ **OpenAI Integration** - Content extraction logic tested
- ✅ **Error Handling** - Edge cases and failures covered
- ✅ **Response Formats** - API contracts validated

Run `npm test` to execute all tests and ensure your changes don't break existing functionality!