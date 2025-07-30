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

// Import after mocking
import { saveDocument, findDocumentByName, getAllDocuments, prisma } from '@/lib/database'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

const mockDocumentParams = {
  fileId: 'test-file-id',
  filename: 'test.pdf',
  originalName: 'test.pdf',
  fileSize: 12345,
  fileType: 'application/pdf',
  extractedContent: {
    tables: [{ row: 'test', column: 'test', value: 'test' }],
    rawText: 'test content'
  },
  vectorStoreId: 'vs_test',
  vectorStoreFileId: 'file_test',
  extractedFileId: 'file_extracted_test',
  processingTimeMs: 5000,
  status: 'success' as const
}

const mockDocument = {
  id: 'test-doc-1',
  uploadedAt: '2024-01-01T00:00:00.000Z',
  ...mockDocumentParams
}

describe('Database Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })


  describe('saveDocument', () => {
    it('should save document successfully', async () => {
      mockPrisma.document.create.mockResolvedValue(mockDocument as any)

      const result = await saveDocument(mockDocumentParams)

      expect(mockPrisma.document.create).toHaveBeenCalledWith({
        data: {
          fileId: 'test-file-id',
          filename: 'test.pdf',
          originalName: 'test.pdf',
          fileSize: 12345,
          fileType: 'application/pdf',
          extractedContent: mockDocumentParams.extractedContent,
          vectorStoreId: 'vs_test',
          vectorStoreFileId: 'file_test',
          extractedFileId: 'file_extracted_test',
          processingTimeMs: 5000,
          status: 'success'
        }
      })

      expect(result).toEqual(mockDocument)
    })

    it('should use default status when not provided', async () => {
      mockPrisma.document.create.mockResolvedValue(mockDocument as any)

      const paramsWithoutStatus = { ...mockDocumentParams }
      delete paramsWithoutStatus.status

      await saveDocument(paramsWithoutStatus)

      expect(mockPrisma.document.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'success'
        })
      })
    })

    it('should handle database errors', async () => {
      mockPrisma.document.create.mockRejectedValue(new Error('Database error'))

      await expect(saveDocument(mockDocumentParams)).rejects.toThrow('Database save document failed')
    })

    it('should handle optional fields correctly', async () => {
      mockPrisma.document.create.mockResolvedValue(mockDocument as any)

      const minimalParams = {
        fileId: 'test-file-id',
        filename: 'test.pdf',
        originalName: 'test.pdf',
        fileSize: 12345,
        fileType: 'application/pdf',
        extractedContent: null
      }

      await saveDocument(minimalParams)

      expect(mockPrisma.document.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          vectorStoreId: undefined,
          vectorStoreFileId: undefined,
          extractedFileId: undefined,
          processingTimeMs: undefined
        })
      })
    })
  })

  describe('findDocumentByName', () => {
    it('should find document by name successfully', async () => {
      mockPrisma.document.findFirst.mockResolvedValue(mockDocument as any)

      const result = await findDocumentByName('test.pdf')

      expect(mockPrisma.document.findFirst).toHaveBeenCalledWith({
        where: { originalName: 'test.pdf' }
      })

      expect(result).toEqual(mockDocument)
    })

    it('should return null when document not found', async () => {
      mockPrisma.document.findFirst.mockResolvedValue(null)

      const result = await findDocumentByName('nonexistent.pdf')

      expect(result).toBeNull()
    })

    it('should handle database errors', async () => {
      mockPrisma.document.findFirst.mockRejectedValue(new Error('Database error'))

      await expect(findDocumentByName('test.pdf')).rejects.toThrow('Database check for existing document failed')
    })
  })

  describe('getAllDocuments', () => {
    it('should return all documents successfully', async () => {
      const mockDocuments = [mockDocument, { ...mockDocument, id: 'test-doc-2' }]
      mockPrisma.document.findMany.mockResolvedValue(mockDocuments as any)

      const result = await getAllDocuments()

      expect(mockPrisma.document.findMany).toHaveBeenCalledWith({
        orderBy: { uploadedAt: 'desc' }
      })

      expect(result).toEqual(mockDocuments)
      expect(result).toHaveLength(2)
    })

    it('should return empty array when no documents exist', async () => {
      mockPrisma.document.findMany.mockResolvedValue([])

      const result = await getAllDocuments()

      expect(result).toEqual([])
    })

    it('should handle database errors', async () => {
      mockPrisma.document.findMany.mockRejectedValue(new Error('Database error'))

      await expect(getAllDocuments()).rejects.toThrow('Database fetch all documents failed')
    })

    it('should order documents by uploadedAt in descending order', async () => {
      mockPrisma.document.findMany.mockResolvedValue([])

      await getAllDocuments()

      expect(mockPrisma.document.findMany).toHaveBeenCalledWith({
        orderBy: { uploadedAt: 'desc' }
      })
    })
  })
})