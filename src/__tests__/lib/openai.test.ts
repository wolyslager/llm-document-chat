// Mock the logger first to prevent Pino initialization issues
jest.mock('@/lib/logger', () => {
  const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    dbOperation: jest.fn(),
    dbError: jest.fn(),
    apiRequest: jest.fn(),
    apiResponse: jest.fn(),
    processStart: jest.fn(),
    processStep: jest.fn(),
    processComplete: jest.fn(),
    processError: jest.fn()
  };

  return {
    createLogger: jest.fn(() => mockLogger),
    dbLogger: mockLogger,
    apiLogger: mockLogger,
    openaiLogger: mockLogger,
    default: {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      child: jest.fn(() => mockLogger)
    }
  };
})

// Mock Redis
jest.mock('@upstash/redis', () => ({
  Redis: {
    fromEnv: jest.fn(() => ({
      get: jest.fn(),
      set: jest.fn(),
      setex: jest.fn()
    }))
  }
}))

// Mock OpenAI constructor to return a shared instance
jest.mock('openai', () => {
  const mockOpenAIInstance = {
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }
  
  return jest.fn().mockImplementation(() => mockOpenAIInstance)
})

// Import after mocking
import { extractTablesAndText, getFileType } from '@/lib/openai'
import OpenAI from 'openai'

const mockOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>
// Get the shared mock instance by calling the constructor
const mockOpenAIInstance = new mockOpenAI()

// Mock file system operations
jest.mock('fs', () => ({
  promises: {
    mkdtemp: jest.fn(),
    writeFile: jest.fn(),
    readdir: jest.fn(),
    readFile: jest.fn(),
    rm: jest.fn()
  }
}))

// Mock child_process
jest.mock('child_process', () => ({
  exec: jest.fn()
}))

// Mock util
jest.mock('util', () => ({
  promisify: jest.fn()
}))


describe('OpenAI Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })


  describe('getFileType', () => {
    it('should identify PDF files correctly', () => {
      expect(getFileType('document.pdf', 'application/pdf')).toBe('pdf')
      expect(getFileType('document.PDF', 'application/pdf')).toBe('pdf')
    })

    it('should identify image files correctly', () => {
      expect(getFileType('image.png', 'image/png')).toBe('image')
      expect(getFileType('image.jpg', 'image/jpeg')).toBe('image')
      expect(getFileType('image.jpeg', 'image/jpeg')).toBe('image')
      expect(getFileType('image.gif', 'image/gif')).toBe('image')
      expect(getFileType('image.webp', 'image/webp')).toBe('image')
    })

    it('should identify text files correctly', () => {
      expect(getFileType('document.txt', 'text/plain')).toBe('text')
      expect(getFileType('data.csv', 'text/csv')).toBe('text')
      expect(getFileType('unknown.xyz', 'application/unknown')).toBe('text')
    })

    it('should prioritize extension for images but MIME type for others', () => {
      expect(getFileType('fake.txt', 'image/png')).toBe('image')
      expect(getFileType('fake.jpg', 'application/pdf')).toBe('image') // extension wins for images
    })
  })

  describe('extractTablesAndText', () => {
    const mockChatCompletion = {
      choices: [{
        message: {
          content: JSON.stringify({
            tables: [
              { row: 'Row1', column: 'Col1', value: 'Value1' },
              { row: 'Row1', column: 'Col2', value: 'Value2' }
            ],
            rawText: 'Sample extracted text content'
          })
        }
      }]
    }

    beforeEach(() => {
      // Reset and setup the mock for each test
      jest.clearAllMocks()
      mockOpenAIInstance.chat.completions.create.mockResolvedValue(mockChatCompletion)
    })

    it('should process text files directly', async () => {
      const textBuffer = Buffer.from('Col1,Col2\nValue1,Value2\nValue3,Value4')
      
      const result = await extractTablesAndText(textBuffer, 'test.csv', 'text/csv')

      expect(result.rawText).toBe('Col1,Col2\nValue1,Value2\nValue3,Value4')
      expect(result.tables).toHaveLength(4) // 2 rows × 2 columns
      expect(result.tables[0]).toEqual({
        row: 'Row 1',
        column: 'Col1',
        value: 'Value1'
      })
    })

    it('should process image files with OpenAI vision', async () => {
      const imageBuffer = Buffer.from('fake-image-data')
      
      const result = await extractTablesAndText(imageBuffer, 'test.png', 'image/png')

      expect(result.tables).toHaveLength(2)
      expect(result.rawText).toBe('Sample extracted text content')
      expect(result.tables[0]).toEqual({
        row: 'Row1',
        column: 'Col1', 
        value: 'Value1'
      })
    })

    it('should handle OpenAI API errors', async () => {
      mockOpenAIInstance.chat.completions.create.mockRejectedValue(new Error('API Error'))

      const imageBuffer = Buffer.from('fake-image-data')
      
      await expect(
        extractTablesAndText(imageBuffer, 'test.png', 'image/png')
      ).rejects.toThrow('API Error')
    })

    it('should handle invalid JSON responses', async () => {
      mockOpenAIInstance.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: 'Invalid JSON response'
          }
        }]
      })

      const imageBuffer = Buffer.from('fake-image-data')
      
      await expect(
        extractTablesAndText(imageBuffer, 'test.png', 'image/png')
      ).rejects.toThrow()
    })

    it('should use custom prompt when provided', async () => {
      mockOpenAIInstance.chat.completions.create.mockResolvedValue(mockChatCompletion)

      const imageBuffer = Buffer.from('fake-image-data')
      const customPrompt = 'Custom extraction prompt'
      
      await extractTablesAndText(imageBuffer, 'test.png', 'image/png', customPrompt)

      expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.arrayContaining([
                expect.objectContaining({
                  text: customPrompt
                })
              ])
            })
          ])
        })
      )
    })
  })
})