import { GET } from '@/app/api/documents/route'
import { GET as getDocument } from '@/app/api/documents/[id]/route'
import { getAllDocuments } from '@/lib/database'
import { prisma } from '@/lib/database'

// Mock the database functions
jest.mock('@/lib/database', () => ({
  getAllDocuments: jest.fn(),
  prisma: {
    document: {
      findUnique: jest.fn(),
    }
  }
}))


const mockDocuments = [
  {
    id: 'test-doc-1',
    fileId: 'direct-processing-test-1',
    filename: 'test.pdf',
    originalName: 'test.pdf',
    fileSize: 12345,
    fileType: 'application/pdf',
    uploadedAt: '2024-01-01T00:00:00.000Z',
    processingTimeMs: 5000,
    status: 'success',
    extractedContent: {
      tables: [{ row: 'test', column: 'test', value: 'test' }],
      rawText: 'test content'
    },
    vectorStoreId: 'vs_test',
    vectorStoreFileId: 'file_test',
    extractedFileId: 'file_extracted_test'
  }
]

describe('Documents API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })


  describe('GET /api/documents', () => {
    it('should return a list of documents successfully', async () => {
      // Mock the database response
      ;(getAllDocuments as jest.Mock).mockResolvedValue(mockDocuments)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.count).toBe(1)
      expect(data.documents).toHaveLength(1)
      
      // Check that full extracted content is included in the response
      expect(data.documents[0]).toHaveProperty('extractedContent')
      expect(data.documents[0].extractedContent.tables).toHaveLength(1)
      expect(data.documents[0].extractedContent.rawText).toBe('test content')
    })

    it('should handle database errors gracefully', async () => {
      ;(getAllDocuments as jest.Mock).mockRejectedValue(new Error('Database error'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('DATABASE_ERROR')
      expect(data.error.message).toBe('Database fetch all documents failed')
    })

    it('should return empty list when no documents exist', async () => {
      ;(getAllDocuments as jest.Mock).mockResolvedValue([])

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.count).toBe(0)
      expect(data.documents).toHaveLength(0)
    })
  })

  describe('GET /api/documents/[id]', () => {
    it('should return a single document successfully', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>
      mockPrisma.document.findUnique.mockResolvedValue(mockDocuments[0] as any)

      const mockRequest = {} as any
      const mockParams = Promise.resolve({ id: 'test-doc-1' })

      const response = await getDocument(mockRequest, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.document.id).toBe('test-doc-1')
      expect(data.document.extractedContent).toBeDefined()
    })

    it('should return 404 for non-existent document', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>
      mockPrisma.document.findUnique.mockResolvedValue(null)

      const mockRequest = {} as any
      const mockParams = Promise.resolve({ id: 'non-existent' })

      const response = await getDocument(mockRequest, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('NOT_FOUND')
      expect(data.error.message).toBe("Document with identifier 'non-existent' not found")
    })

    it('should handle database errors gracefully', async () => {
      const mockPrisma = prisma as jest.Mocked<typeof prisma>
      mockPrisma.document.findUnique.mockRejectedValue(new Error('Database error'))

      const mockRequest = {} as any
      const mockParams = Promise.resolve({ id: 'test-doc-1' })

      const response = await getDocument(mockRequest, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('DATABASE_ERROR')
      expect(data.error.message).toBe('Database fetch document failed')
    })
  })
})