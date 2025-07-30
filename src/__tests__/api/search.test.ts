import { POST } from '@/app/api/search/route'
import { searchVectorStore } from '@/lib/openai'

// Mock the OpenAI functions
jest.mock('@/lib/openai', () => ({
  searchVectorStore: jest.fn()
}))


const mockSearchResult = {
  response: 'The total amount is $150.00【4:0†extracted_sample.pdf.txt】',
  runId: 'run_123',
  threadId: 'thread_456'
}

describe('Search API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })


  describe('POST /api/search', () => {
    it('should perform search successfully and clean citation brackets', async () => {
      ;(searchVectorStore as jest.Mock).mockResolvedValue(mockSearchResult)

      const mockRequest = {
        json: jest.fn().mockResolvedValue({ query: 'What is the total amount?' })
      } as any

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.query).toBe('What is the total amount?')
      expect(data.response).toBe('The total amount is $150.00') // Citation brackets removed
      expect(data.metadata.runId).toBe('run_123')
      expect(data.metadata.threadId).toBe('thread_456')
      expect(data.metadata.searchedAt).toBeDefined()
    })

    it('should return error for missing query', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({})
      } as any

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
      expect(data.error.message).toBe('Validation failed')
    })

    it('should return error for empty query', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({ query: '' })
      } as any

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
      expect(data.error.message).toBe('Validation failed')
    })

    it('should return error for non-string query', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({ query: 123 })
      } as any

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
      expect(data.error.message).toBe('Validation failed')
    })

    it('should handle search errors gracefully', async () => {
      ;(searchVectorStore as jest.Mock).mockRejectedValue(new Error('OpenAI API error'))

      const mockRequest = {
        json: jest.fn().mockResolvedValue({ query: 'test query' })
      } as any

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(502)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('EXTERNAL_SERVICE_ERROR')
      expect(data.error.message).toBe('OpenAI error: OpenAI API error')
    })

    it('should trim whitespace from query', async () => {
      ;(searchVectorStore as jest.Mock).mockResolvedValue(mockSearchResult)

      const mockRequest = {
        json: jest.fn().mockResolvedValue({ query: '  test query  ' })
      } as any

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.query).toBe('test query')
      expect(searchVectorStore).toHaveBeenCalledWith('test query')
    })

    it('should remove various citation patterns', async () => {
      const responseWithCitations = 'Answer with 【citation1】 and [source2] references.'
      ;(searchVectorStore as jest.Mock).mockResolvedValue({
        ...mockSearchResult,
        response: responseWithCitations
      })

      const mockRequest = {
        json: jest.fn().mockResolvedValue({ query: 'test' })
      } as any

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(data.response).toBe('Answer with  and  references.')
    })
  })
})